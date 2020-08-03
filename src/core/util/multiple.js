/**
 * A function for applying multiple mixins more tersely (less verbose)
 * @param {Function[]} mixins - All args to this function should be mixins that take a class and return a class.
 */
export function multiple(...mixins) {
  let Base = class {};

  mixins.forEach(mixin => {
    Base = mixin(Base);
  });

  return Base;
}
