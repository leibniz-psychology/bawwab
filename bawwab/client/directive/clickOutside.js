/* taken from https://stackoverflow.com/a/42389266 (CC BY-SA 4.0) */
export default {
  beforeMount: function (el, binding, vnode) {
    el.clickOutsideEvent = function (event) {
      // here I check that click was outside the el and his children
      if (!(el == event.target || el.contains(event.target))) {
        // and if it did, call method provided in attribute value
        binding.value ();
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted: function (el) {
    document.body.removeEventListener('click', el.clickOutsideEvent)
  },
};
/* end copy */
