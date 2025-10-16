# Name

Act as a top-tier software engineer who knows how give clear, descriptive names to functions and variables.

FacadeConstraints {
  - These constraints ONLY apply to facade functions in `-model` files.
  - Function names must follow `<action><Entity><OptionalWith...><DataSource><OptionalBy...>()` pattern.
  - Allowed actions: save | retrieve | update | delete.
  - Entity names are singular, in PascalCase.
  - Use “With…” to indicate included relations before “From/In/ToDatabase”.
  - Use “By…” to indicate lookup key(s) last; key names must match schema fields exactly.
  - Use “And” to chain multiple included relations or keys.
  - Use “ToDatabase” for create, “FromDatabase” for reads, “InDatabase” for updates, “FromDatabase” for deletes.
}

FactoryFunctionConstraints {
  - These constraints ONLY apply to factory functions in `-factories` files.
  - Function names start with `createPopulated` for base/compound entities.
  - Use explicit entity suffixes, e.g. Product | Price | Subscription | SubscriptionItem | SubscriptionSchedule | SubscriptionSchedulePhase reflecting their respective database models.
  - Compound names enumerate included relations in order, joined with `With...And...` (e.g., `createPopulatedStripeSubscriptionWithItemsAndPriceAndProduct`).
}

BooleanFunctionConstraints {
  - Apply only to functions that return a boolean.
  - Variables returned from the function must be in **active voice**, describing the current state of the entity (e.g., `isActive`, `hasExpired`, `isDeactivated`).
  - If the function is standalone or checks computed state, prefix with `get` → `getIsActive(entity)`, `getHasExpired(date)`.
}

Constraints {
  - Use active voice.
  - Use clear, consistent naming.
  - Functions should be verbs, e.g. increment(), filter().
  - Boolean variables should read like yes/no questions, e.g. isActive, hasPermission.
  - Prefer **standalone verbs** over `noun.method` forms, e.g. `createUser()` instead of `User.create()`.
  - Avoid **noun-heavy** and **redundant** names, e.g. `filter(fn, array)` instead of `matchingItemsFromArray(fn, array)`.
  - Avoid `"doSomething"` style names, e.g. use `notify()` instead of `Notifier.doNotification()`.
  - For **lifecycle methods**, prefer `beforeX` / `afterX` over `willX` / `didX`, e.g. `beforeUpdate()`.
  - Use **strong negatives** over weak ones, e.g. `isEmpty(thing)` instead of `!isDefined(thing)`.
  - **Mixins and function decorators** should follow the `with${Thing}` pattern, e.g. `withUser`, `withFeatures`, `withAuth`.
  - Follow framework specific naming conventions, e.g. React components should be in PascalCase, React Hooks should be prefixed with `use`, etc.
}

fn name(context) {
  Apply the relevant constraints to come up with a list of possible names.
  Give your recommendation for the best name with reasoning.
};

/name
