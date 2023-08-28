import dataAttrsToObject from '@marmot-webdev/dataset-obj';
import { queryElements, loadScriptAsync } from './helpers';

export default class Recaptcha {
  constructor(selector, config = {}) {
    this.selector = selector;
    this.config = config;

    this.defaultConfig = {
      sitekey: null,
      theme: 'auto',
      size: 'auto',
      tabindex: 0,
      constraintValidation: true,
      validationMessage: 'Please confirm that you are not a robot.',
      hl: 'auto',
      url: 'https://www.google.com/recaptcha/api.js',
      callback: null,
      expiredCallback: null,
      errorCallback: null,
      invalidCallback: null,
      loadCallback: null,
      renderCallback: null,
      resetCallback: null
    };

    this.createData();
    this.initialize();
  }

  initialize() {
    this.data.forEach(({ form }) => form.addEventListener('focusout', this.loadOnFocusout));
  }

  createData() {
    this.data = [];

    const recaptchas = queryElements(this.selector);

    for (const recaptcha of recaptchas) {
      const form = recaptcha.closest('form');

      if (form) {
        this.data.push({
          config: this.getConfig(recaptcha, form),
          form,
          recaptcha
        });
      }
    }
  }

  getConfig(recaptcha, form) {
    const config = Object.assign({}, this.defaultConfig, this.config, dataAttrsToObject(recaptcha));

    return new Proxy(config, {
      get(target, prop) {
        const value = target[prop];
        const isFuntion = typeof value === 'function';
        const isCallback = prop.toLowerCase().includes('callback');

        if (isFuntion && !isCallback) {
          return value({ config, form, recaptcha });
        }

        if (value === 'auto') {
          if (prop === 'theme') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          }

          if (prop === 'size') {
            return window.innerWidth > 374 ? 'normal' : 'compact';
          }
        }

        return value;
      }
    });
  }

  getDataById(id) {
    return this.data.find(({ recaptcha }) => +recaptcha.dataset.id === id);
  }

  getDataByForm(form) {
    return this.data.find(({ form: f }) => f === form);
  }

  getURL({ config }) {
    const { url, hl } = config;
    const newURL = new URL(url);

    newURL.searchParams.set('render', 'explicit');

    if (hl && hl !== 'auto') {
      newURL.searchParams.set('hl', hl);
    }

    return newURL.href;
  }

  loadOnFocusout = ({ target: t }) => {
    if (!t.value) return;

    const dataObject = this.getDataByForm(t.form);
    const url = this.getURL(dataObject);

    loadScriptAsync(url).then(() => {
      this.addCallback(dataObject, 'loadCallback');
      this.wrapWithProxy();
      this.render(dataObject);

      this.data.forEach(({ form }) => {
        form.removeEventListener('focusout', this.loadOnFocusout);

        if (form !== t.form) {
          form.addEventListener('focusout', this.renderOnFocusout);
        }
      });
    }).catch(error => console.error(`Error loading script. ${error}`));
  }

  renderOnFocusout = ({ target: t }) => {
    if (!t.value) return;

    this.render(this.getDataByForm(t.form));

    t.form.removeEventListener('focusout', this.renderOnFocusout);
  }

  addCallback(dataObject, callbackName) {
    const callback = dataObject.config[callbackName];

    if (typeof callback === 'function') {
      callback(dataObject);
    }
  }

  wrapWithProxy() {
    grecaptcha.ready(() => {
      grecaptcha = new Proxy(grecaptcha, {
        get: (target, prop) => {
          const value = target[prop];

          if (typeof value === 'function') {
            return (...args) => {
              if (prop === 'reset') {
                const id = args[0] || 0;
                const dataObject = this.getDataById(id);

                dataObject.checkbox.checked = false;
                this.addCallback(dataObject, 'resetCallback');
              }

              return value.apply(target, args);
            };
          }

          return value;
        }
      });
    });
  }

  render(dataObject) {
    grecaptcha.ready(() => {
      const {
        recaptcha,
        config: {
          sitekey,
          theme,
          size,
          tabindex
        }
      } = dataObject;

      const addCallback = callbackName => this.validate(dataObject, callbackName);

      this.addCheckbox(dataObject);

      recaptcha.dataset.id = grecaptcha.render(recaptcha, {
        sitekey,
        theme,
        size,
        tabindex,
        callback: addCallback('callback'),
        'expired-callback': addCallback('expiredCallback'),
        'error-callback': addCallback('errorCallback')
      });

      this.addCallback(dataObject, 'renderCallback');
    });
  }

  validate(dataObject, callbackName) {
    return (response) => {
      const { checkbox } = dataObject;

      checkbox.value = response;
      checkbox.checked = !!response;
      checkbox.dispatchEvent(new Event('change'));

      this.addCallback(dataObject, callbackName);
    };
  }

  createCheckbox() {
    const input = document.createElement('input');

    input.classList.add('g-recaptcha-checkbox');
    input.type = 'checkbox';
    input.name = 'g-recaptcha-response';
    input.required = true;

    return input;
  }

  addCheckbox(dataObject) {
    const {
      recaptcha,
      config: {
        constraintValidation,
        validationMessage
      }
    } = dataObject;

    if (!this.checkbox) {
      this.checkbox = this.createCheckbox();
    }

    const checkbox = this.checkbox.cloneNode();

    checkbox.addEventListener('invalid', e => {
      if (constraintValidation) {
        e.target.setCustomValidity(validationMessage);
      } else {
        e.preventDefault();
      }

      this.addCallback(dataObject, 'invalidCallback');
    });

    if (constraintValidation) {
      checkbox.addEventListener('change', e => e.target.setCustomValidity(''));
    }

    recaptcha.after(checkbox);

    dataObject.checkbox = checkbox;

    return checkbox;
  }
}