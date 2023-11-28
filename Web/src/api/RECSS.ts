const _ = require('lodash');

const RECSS = {
  injectCss(css, options) {
    let elm = document.createElement('style');
    elm.setAttribute('type', 'text/css');

    let updateCss = (newCss) => {
      if ('textContent' in elm) {
        elm.textContent = newCss;
      } else {
        // @ts-ignore
        elm.styleSheet.cssText = newCss;
      }
    };

    updateCss(css);

    let head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
      head.insertBefore(elm, head.childNodes[0]);
    } else {
      head.appendChild(elm);
    }

    return {
      update(newCss) {
        updateCss(newCss);
      },

      remove() {
        head.removeChild(elm);
      },
    };
  },
};

export default RECSS;
