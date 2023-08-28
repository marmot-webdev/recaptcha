# @marmot-webdev/recaptcha

This module offers functionality for dynamic loading, rendering, and validating Google reCAPTCHA v2 widgets ([checkbox type](https://developers.google.com/recaptcha/docs/display)). It is designed to optimize page performance by loading and rendering reCAPTCHA widgets only when users interact with form elements.

Key features:
1. Lazy Loading.
2. Built-in Validation.
3. Multiple Widgets Support.
4. Flexibility and Small Size.

## Installation

```sh
npm install @marmot-webdev/recaptcha
```

## Usage

### HTML

```html
<form><div class="js-recaptcha"></div></form>
```

### JS

```js
import Recaptcha from '@marmot-webdev/recaptcha';

const recaptcha = new Recaptcha('.js-recaptcha', {
  sitekey: 'your-site-key'
});
```

Configuration options can also be set directly on the HTML elements using data attributes:

```html
<div class="js-recaptcha" data-sitekey="your-site-key" data-validation-message="Confirm that you are a real person."></div>
```

### CSS

```css
/* Make sure that the parent of .g-recaptcha-checkbox has relative positioning. */

.g-recaptcha-checkbox {
  position: absolute;
  top: 36px;
  left: 20px;
  z-index: -1;
  opacity: 0;
}
```

## Configuration

Here's a quick overview of the default configuration options:

```js
{
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
}
```

Any configuration option can be a function. It should return the appropriate value if it is not a callback (see [example](#how-do-i-customize-the-recaptcha-size-based-on-the-form-width) in the FAQ section).

### sitekey

Type: `String` | `Function`\
Default: `null`

Your site key. This is a **required** option.

### theme

Type: `String` | `Function`\
Default: `auto`

The color theme of the widget. Available values are `light`, `dark`, and `auto`. The `auto` value follows the user's system preference for light or dark mode.

### size

Type: `String` | `Function`\
Default: `auto`

The size of the widget. Available values are `compact`, `normal`, and `auto`. The `auto` value adjusts the size based on the viewport width.

### tabindex

Type: `Number` | `Function`\
Default: `0`

The tabindex of the widget.

### constraintValidation

Type: `Boolean` | `Function`\
Default: `true`

Whether or not to use the Constraint Validation API, particularly for displaying validation messages.

### validationMessage

Type: `String` | `Function`\
Default: `'Please confirm that you are not a robot.'`

Specifies the validation message that is shown when the reCAPTCHA checkbox is not checked and validation fails.

### hl

Type: `String` | `Function`\
Default: `'auto'`

Sets the [language code](https://developers.google.com/recaptcha/docs/language) for localization of the reCAPTCHA widget.

### url

Type: `String` | `Function`\
Default: `'https://www.google.com/recaptcha/api.js'`

The URL to load the reCAPTCHA API script. You can provide an [alternative URL](https://developers.google.com/recaptcha/docs/faq#can-i-use-recaptcha-globally) if needed.

### callback(dataObject)

Type: `Function`\
Default: `null`

This callback is executed when reCAPTCHA successfully validates a user's response.

### expiredCallback(dataObject)

Type: `Function`\
Default: `null`

This callback is executed when the reCAPTCHA response expires.

### errorCallback(dataObject)

Type: `Function`\
Default: `null`

This callback is executed when an error occurs during reCAPTCHA validation.

### invalidCallback(dataObject)

Type: `Function`\
Default: `null`

This callback is executed when the user response to the reCAPTCHA challenge is considered invalid.

### loadCallback(dataObject)

Type: `Function`\
Default: `null`

This callback is executed when the reCAPTCHA script is successfully loaded.

### renderCallback(dataObject)

Type: `Function`\
Default: `null`

This callback is executed when the reCAPTCHA widget is successfully rendered.

### resetCallback(dataObject)

Type: `Function`\
Default: `null`

This callback is executed when the reCAPTCHA is reset explicitly using the `reset` method.

## FAQ

### reCAPTCHA is not working. What am I doing wrong?

If your reCAPTCHA is not working, make sure that it is placed within a `<form>` element.

### How do I customize the reCAPTCHA size based on the form width?

```js
const recaptcha = new Recaptcha('.js-recaptcha', {
  size: (dataObject) => {
    const { width } = dataObject.form.getBoundingClientRect();

    if (width > 320) {
      return 'normal';
    }

    return 'compact';
  }
});
```

### How do I customize the validation message on a multilingual site?

```js
const recaptcha = new Recaptcha('.js-recaptcha', {
  validationMessage: getValidationMessage
});

function getValidationMessage() {
  const { lang } = document.documentElement;

  const messages = {
    'en-GB': 'Please confirm you\'re not a robot.',
    'es-ES': 'Por favor, confirma que no eres un robot.',
    'sv-SE': 'Vänligen bekräfta att du inte är en robot.',
    'uk-UA': 'Будь ласка, підтвердіть, що Ви не робот.'
  };

  return messages[lang] || messages['en-GB'];
}
```

### How can I create a custom validation message?

```js
const recaptcha = new Recaptcha('.js-recaptcha', {
  constraintValidation: false,
  renderCallback: ({ recaptcha }) => addMessage(recaptcha, 'Please confirm that you are not a robot.'),
  callback: ({ recaptcha }) => hideMessage(recaptcha, true),
  invalidCallback: ({ recaptcha }) => hideMessage(recaptcha, false)
});

function addMessage(recaptcha, message) {
  const container = `<p class="g-recaptcha-error" hidden>${message}</p>`;
  recaptcha.parentElement.insertAdjacentHTML('beforeend', container);
}

function hideMessage(recaptcha, shouldHide) {
  recaptcha.parentElement.querySelector('.g-recaptcha-error').hidden = shouldHide;
}
```

## Copyright and license

Copyright (c) 2023—present, Serhii Babakov.

This code is provided under [the MIT License](/license.txt).