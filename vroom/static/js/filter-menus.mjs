/**
 * Compact, multi-select menus for the primary car characteristics.
 *
 * `onChange` receives `{ group, stateKey, values, patch }`, where `patch` is
 * safe to merge into the application's filter object. Values deliberately use
 * the catalogue/URL vocabulary (for example `hatch`, `ev`, `drivers-car`) rather than
 * display labels.
 */
export const FILTER_MENU_GROUPS = Object.freeze([
  Object.freeze({
    id: 'body', label: 'Body', stateKey: 'bodies', queryKey: 'b',
    options: Object.freeze([
      Object.freeze({ value: 'hatch', label: 'Hatchback' }),
      Object.freeze({ value: 'saloon', label: 'Saloon' }),
      Object.freeze({ value: 'estate', label: 'Estate' }),
      Object.freeze({ value: 'suv', label: 'SUV' }),
      Object.freeze({ value: 'coupe', label: 'Coupé' }),
      Object.freeze({ value: 'convertible', label: 'Convertible' }),
      Object.freeze({ value: 'mpv', label: 'MPV' }),
      Object.freeze({ value: 'van', label: 'Van' }),
      Object.freeze({ value: 'pickup', label: 'Pick-up' }),
    ]),
  }),
  Object.freeze({
    id: 'fuel', label: 'Fuel', stateKey: 'fuels', queryKey: 'f',
    options: Object.freeze([
      Object.freeze({ value: 'petrol', label: 'Petrol' }),
      Object.freeze({ value: 'diesel', label: 'Diesel' }),
      Object.freeze({ value: 'hybrid', label: 'Hybrid' }),
      Object.freeze({ value: 'phev', label: 'Plug-in hybrid' }),
      Object.freeze({ value: 'ev', label: 'Electric' }),
    ]),
  }),
  Object.freeze({
    id: 'character', label: 'Character', stateKey: 'vibes', queryKey: 'v',
    options: Object.freeze([
      Object.freeze({ value: 'drivers-car', label: 'Driver’s car' }),
      Object.freeze({ value: 'family-bus', label: 'Family hero' }),
      Object.freeze({ value: 'city-darling', label: 'City friendly' }),
      Object.freeze({ value: 'boxy-icon', label: 'Boxy icon' }),
      Object.freeze({ value: 'seven-seats', label: 'Seven seats' }),
      Object.freeze({ value: 'cheap-to-run', label: 'Cheap to run' }),
    ]),
  }),
]);

export function filterMenuGroup(id, groups = FILTER_MENU_GROUPS) {
  return groups.find(group => group.id === id || group.stateKey === id) || null;
}

export function menuSelection(filters, group) {
  const definition = typeof group === 'string' ? filterMenuGroup(group) : group;
  if (!definition) return [];
  const allowed = new Set(definition.options.map(option => option.value));
  const values = Array.isArray(filters?.[definition.stateKey]) ? filters[definition.stateKey] : [];
  return [...new Set(values.map(String).filter(value => allowed.has(value)))];
}

export function filterMenuPatch(filters, group, value) {
  const definition = typeof group === 'string' ? filterMenuGroup(group) : group;
  if (!definition) throw new TypeError('Unknown filter-menu group');
  const allowed = new Set(definition.options.map(option => option.value));
  const selected = new Set(menuSelection(filters, definition));
  if (value === null || value === undefined || value === 'all') selected.clear();
  else if (!allowed.has(String(value))) throw new TypeError(`Unknown ${definition.id} filter value: ${value}`);
  else if (selected.has(String(value))) selected.delete(String(value));
  else selected.add(String(value));
  return { [definition.stateKey]: definition.options.map(option => option.value).filter(option => selected.has(option)) };
}

function makeElement(documentObject, tag, className, text) {
  const node = documentObject.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function isDesktopHover(windowObject) {
  return Boolean(windowObject?.matchMedia?.('(hover: hover) and (pointer: fine)').matches);
}

/**
 * Renders and owns menu interaction inside `container`.
 *
 * Call `setFilters(nextFilters)` after any external filter or URL update.
 * The controller deliberately does not write history or mutate application
 * state; the supplied callback is the integration boundary.
 */
export function createFilterMenus(container, {
  filters = {}, onChange = () => {}, groups = FILTER_MENU_GROUPS,
  documentObject = container?.ownerDocument || globalThis.document,
  windowObject = documentObject?.defaultView || globalThis.window,
} = {}) {
  if (!container?.replaceChildren || !documentObject?.createElement) {
    throw new TypeError('createFilterMenus requires a DOM container');
  }

  let currentFilters = { ...filters };
  let openGroup = null;
  const records = new Map();
  const root = makeElement(documentObject, 'div', 'filter-menus');
  root.setAttribute('aria-label', 'Car characteristics');
  root.setAttribute('role', 'group');
  container.replaceChildren(root);

  function close(group = openGroup, { restoreFocus = false } = {}) {
    if (!group || openGroup !== group) return;
    const record = records.get(group.id);
    record.button.setAttribute('aria-expanded', 'false');
    record.menu.hidden = true;
    openGroup = null;
    if (restoreFocus) record.button.focus();
  }

  function open(group, { focus = null } = {}) {
    if (openGroup && openGroup !== group) close(openGroup);
    const record = records.get(group.id);
    record.menu.hidden = false;
    record.button.setAttribute('aria-expanded', 'true');
    openGroup = group;
    if (focus) {
      const items = [...record.menu.querySelectorAll('[role="menuitemcheckbox"]')];
      (focus === 'last' ? items.at(-1) : items[0])?.focus();
    }
  }

  function sync() {
    for (const group of groups) {
      const record = records.get(group.id);
      const selected = menuSelection(currentFilters, group);
      const count = selected.length;
      const selectedLabels = selected.map(value => group.options.find(option => option.value === value)?.label).filter(Boolean);
      record.button.querySelector('[data-filter-menu-label]').textContent = count === 0
        ? group.label
        : `${group.label}: ${selectedLabels[0]}${count > 1 ? ` +${count - 1}` : ''}`;
      record.button.classList.toggle('is-active', count > 0);
      record.button.setAttribute('aria-label', `${group.label}${count ? `, ${selectedLabels.join(' and ')} selected` : ', all'}`);
      record.items.forEach(({ button, value }) => {
        const checked = value === 'all' ? count === 0 : selected.includes(value);
        button.setAttribute('aria-checked', String(checked));
        button.classList.toggle('is-selected', checked);
      });
    }
  }

  function choose(group, value) {
    const patch = filterMenuPatch(currentFilters, group, value);
    currentFilters = { ...currentFilters, ...patch };
    sync();
    onChange({ group: group.id, stateKey: group.stateKey, values: patch[group.stateKey], patch });
  }

  for (const group of groups) {
    const wrap = makeElement(documentObject, 'div', 'filter-menu');
    const button = makeElement(documentObject, 'button', 'filter-menu__trigger');
    button.type = 'button';
    button.id = `filter-menu-${group.id}-trigger`;
    button.setAttribute('aria-controls', `filter-menu-${group.id}`);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-haspopup', 'menu');
    const label = makeElement(documentObject, 'span', 'filter-menu__label', group.label);
    label.dataset.filterMenuLabel = '';
    const chevron = makeElement(documentObject, 'span', 'filter-menu__chevron', '⌄');
    chevron.setAttribute('aria-hidden', 'true');
    button.append(label, chevron);

    const menu = makeElement(documentObject, 'div', 'filter-menu__list');
    menu.id = `filter-menu-${group.id}`;
    menu.hidden = true;
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-labelledby', button.id);
    const items = [];
    const choices = [{ value: 'all', label: 'All' }, ...group.options];
    for (const option of choices) {
      const item = makeElement(documentObject, 'button', 'filter-menu__option', option.label);
      item.type = 'button';
      item.dataset.value = option.value;
      item.setAttribute('role', 'menuitemcheckbox');
      item.setAttribute('aria-checked', 'false');
      item.addEventListener('click', () => choose(group, option.value));
      menu.append(item);
      items.push({ button: item, value: option.value });
    }
    button.addEventListener('click', event => {
      if (openGroup === group && !isDesktopHover(windowObject)) close(group);
      else open(group, { focus: event.detail === 0 ? 'first' : null });
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        open(group, { focus: event.key === 'ArrowUp' ? 'last' : 'first' });
      } else if (event.key === 'Escape') close(group, { restoreFocus: true });
    });
    wrap.addEventListener('pointerenter', () => { if (isDesktopHover(windowObject)) open(group); });
    wrap.addEventListener('pointerleave', () => { if (isDesktopHover(windowObject)) close(group); });
    wrap.addEventListener('focusout', () => {
      windowObject?.setTimeout?.(() => {
        if (!wrap.contains(documentObject.activeElement)) close(group);
      }, 0);
    });
    menu.addEventListener('keydown', event => {
      const buttons = items.map(item => item.button);
      const index = buttons.indexOf(documentObject.activeElement);
      if (event.key === 'Escape') { event.preventDefault(); close(group, { restoreFocus: true }); }
      else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        buttons[event.key === 'Home' ? 0 : buttons.length - 1]?.focus();
      } else if (event.key === 'Tab') close(group);
    });
    wrap.append(button, menu);
    root.append(wrap);
    records.set(group.id, { button, menu, items });
  }

  const onDocumentPointerDown = event => {
    if (!root.contains(event.target)) close();
  };
  documentObject.addEventListener('pointerdown', onDocumentPointerDown);
  sync();

  return {
    element: root,
    getFilters: () => ({ ...currentFilters }),
    setFilters(nextFilters = {}) { currentFilters = { ...nextFilters }; sync(); },
    close: () => close(),
    destroy() { documentObject.removeEventListener('pointerdown', onDocumentPointerDown); root.remove(); },
  };
}
