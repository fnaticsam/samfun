import { loadCatalogue } from './data.mjs';
import { renderCardBatch, updateSavedButtons } from './cards.mjs';
import { createCompareController, normalizeCompared, toggleCompared } from './compare.mjs';
import { createDetailController } from './detail.mjs';
import { createFilterMenus, FILTER_MENU_GROUPS } from './filter-menus.mjs';
import { carHash, compareHash, filtersToHash, parseHash, replaceHash } from './router.mjs';
import {
  createFilters, DEFAULT_FILTERS, determineEfficiencyMode, filterCars, toggleFilterValue,
} from './state.mjs';
import { bindSliderDeck } from './sliders.mjs';
import {
  FILTERS_KEY, loadCompared, loadSaved, safeRead, safeWrite, saveCompared, saveSaved, toggleSaved,
} from './storage.mjs';
import { findTwins } from './twins.mjs';
import { setImageFallback } from './utils.mjs';

const PAGE_SIZE = 48;

function element(id) {
  return document.getElementById(id);
}

function preferredScrollBehavior() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

function showOnlyState(name) {
  for (const state of ['loading', 'error']) {
    const node = element(`${state}-state`);
    if (node) node.hidden = state !== name;
  }
  const boot = element('boot-screen');
  const toolbar = document.querySelector('.results-toolbar');
  if (toolbar) toolbar.hidden = name === 'error';
  if (boot && name !== 'loading') {
    if (name === 'ready') boot.classList.add('is-ready');
    boot.hidden = true;
  }
}

function createToast(region) {
  return (message, tone = 'info') => {
    if (!region) return;
    [...region.children].filter(node => node.textContent === message).forEach(node => node.remove());
    while (region.children.length >= 2) region.firstElementChild?.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast--${tone}`;
    toast.setAttribute('role', tone === 'error' ? 'alert' : 'status');
    toast.textContent = message;
    region.append(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      setTimeout(() => toast.remove(), 500);
    }, 2600);
  };
}

function setDrawerOpen(drawer, open) {
  if (!drawer) return;
  if (typeof HTMLDialogElement !== 'undefined' && drawer instanceof HTMLDialogElement) {
    if (open && !drawer.open) drawer.showModal();
    if (!open && drawer.open) drawer.close();
  } else {
    drawer.hidden = !open;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
  }
}

function activeFilterCount(filters) {
  return filters.bodies.length + filters.fuels.length + filters.vibes.length + filters.makes.length
    + Number(filters.bestOnly) + Number(filters.savedOnly)
    + Number(filters.budget[0] !== DEFAULT_FILTERS.budget[0] || filters.budget[1] !== DEFAULT_FILTERS.budget[1])
    + Number(filters.age[0] !== DEFAULT_FILTERS.age[0] || filters.age[1] !== DEFAULT_FILTERS.age[1])
    + Number(filters.accelMax !== DEFAULT_FILTERS.accelMax) + Number(filters.efficiencyMin !== 0)
    + Number(filters.seatsMin > 0) + Number(filters.bootMin > 0) + Number(filters.onSaleOnly);
}

function canonicalFilter(kind, value) {
  const group = { body: 'bodies', fuel: 'fuels', vibe: 'vibes', tag: 'vibes', make: 'makes' }[kind] || kind;
  const aliases = { hatchback: 'hatch', 'family-hero': 'family-bus' };
  return { group, value: aliases[value] || value };
}

async function start() {
  const grid = element('results-grid');
  const resultCount = element('result-count');
  const resultNoun = element('result-noun');
  const search = element('search-input');
  const sort = element('sort-select');
  const chiprail = element('chiprail');
  const sliderDeck = element('slider-deck') || document;
  const drawer = element('filter-drawer');
  const emptyState = element('empty-state');
  const providedMoreButton = element('load-more');
  const toast = createToast(element('toast-region'));
  const dialog = element('car-dialog');
  const detail = createDetailController(dialog, element('detail-content'));
  const compareDialog = element('compare-dialog');
  const comparison = createCompareController(compareDialog, compareDialog?.querySelector('[data-compare-content]'));
  const persisted = safeRead(FILTERS_KEY, null);
  const initialRoute = parseHash(location.hash);
  let filters = initialRoute.type === 'query'
    ? initialRoute.filters
    : createFilters(persisted && typeof persisted === 'object' ? persisted : {});
  // Older shared links used `match`, which was only an alias for score order.
  // Keep those links working without presenting a misleading sort option.
  if (filters.sort === 'match') filters.sort = 'score';
  let savedIds = loadSaved();
  let comparedIds = loadCompared();
  let visibleCars = [];
  let rendered = 0;
  let moreButton = providedMoreButton;
  let sliderRenderFrame = 0;
  let filterMenus = null;
  let pendingDetailTrigger = null;

  showOnlyState('loading');
  const { cars, byId, meta } = await loadCatalogue();
  const validCarIds = new Set(byId.keys());
  savedIds = new Set([...savedIds].filter(id => validCarIds.has(id)));
  saveSaved(savedIds);
  const persistedCompared = normalizeCompared(comparedIds, validCarIds);
  const routedCompared = initialRoute.type === 'compare'
    ? normalizeCompared(initialRoute.ids, validCarIds)
    : [];
  comparedIds = new Set(initialRoute.type === 'compare' && routedCompared.length >= 2
    ? routedCompared
    : persistedCompared);
  saveCompared(comparedIds);
  document.documentElement.dataset.catalogueReady = 'true';
  document.documentElement.style.setProperty('--catalogue-count', String(meta.count || cars.length));

  filterMenus = createFilterMenus(element('filter-menu-root'), {
    filters,
    groups: FILTER_MENU_GROUPS.filter(group => group.id !== 'body'),
    onChange: ({ stateKey, patch }) => {
      const oldEfficiencyMode = determineEfficiencyMode(filters);
      Object.assign(filters, patch);
      if (stateKey === 'fuels' && oldEfficiencyMode !== determineEfficiencyMode(filters)) filters.efficiencyMin = 0;
      render();
    },
  });

  function setButtonStates() {
    document.querySelectorAll('[data-filter]').forEach(button => {
      const kind = button.dataset.filter;
      const value = button.dataset.value;
      const canonical = canonicalFilter(kind, value);
      const { group } = canonical;
      let pressed = false;
      if (kind === 'all') pressed = activeFilterCount(filters) === 0 && !filters.query;
      else if (['bodies', 'fuels', 'vibes', 'makes'].includes(group)) pressed = filters[group].includes(canonical.value);
      else if (kind === 'best') pressed = filters.bestOnly;
      else if (kind === 'saved') pressed = filters.savedOnly;
      else if (kind === 'halo') pressed = filters.includeHalo;
      button.classList.toggle('is-active', pressed);
      button.setAttribute('aria-pressed', String(pressed));
    });
    document.querySelectorAll('[data-filter-count]').forEach(node => {
      const count = activeFilterCount(filters);
      node.textContent = count;
      node.hidden = count === 0;
    });
    document.querySelectorAll('[data-saved-count]').forEach(node => { node.textContent = savedIds.size; });
    const clearSearch = document.querySelector('[data-action="clear-search"]');
    if (clearSearch) clearSearch.hidden = !filters.query;
    document.querySelectorAll('[data-action="show-saved"]').forEach(node => node.setAttribute('aria-pressed', String(filters.savedOnly)));
    document.querySelectorAll('[data-tab="saved"]').forEach(node => {
      node.classList.toggle('is-active', filters.savedOnly);
      if (filters.savedOnly) node.setAttribute('aria-current', 'page');
      else node.removeAttribute('aria-current');
    });
    document.querySelectorAll('[data-tab="browse"]').forEach(node => {
      node.classList.toggle('is-active', !filters.savedOnly);
      if (!filters.savedOnly) node.setAttribute('aria-current', 'page');
      else node.removeAttribute('aria-current');
    });
  }

  function updateCompareButtons(changedId = null) {
    const selector = changedId
      ? `.compare-button[data-action="compare"][data-id="${globalThis.CSS?.escape ? CSS.escape(changedId) : changedId}"]`
      : '.compare-button[data-action="compare"][data-id]';
    document.querySelectorAll(selector).forEach(button => {
      const active = comparedIds.has(button.dataset.id);
      button.classList.toggle('is-compared', active);
      button.setAttribute('aria-pressed', String(active));
      const label = button.dataset.label || 'car';
      button.setAttribute('aria-label', `${active ? 'Remove' : 'Add'} ${label} ${active ? 'from' : 'to'} comparison`);
      button.innerHTML = `<span aria-hidden="true">${active ? '✓' : '+'}</span> ${active ? 'Comparing' : 'Compare'}`;
    });
  }

  function syncCompareUI(changedId = null) {
    const count = comparedIds.size;
    document.querySelectorAll('[data-compare-count]').forEach(node => { node.textContent = count; });
    const tray = element('compare-tray');
    if (tray) tray.hidden = count === 0;
    document.querySelectorAll('[data-action="open-compare"]').forEach(button => {
      button.disabled = count < 2;
      button.setAttribute('aria-label', count < 2 ? `Choose ${2 - count} more car${count ? '' : 's'} to compare` : `Compare ${count} selected cars`);
    });
    updateCompareButtons(changedId);
  }

  function appendNextPage() {
    if (!grid || rendered >= visibleCars.length) return;
    rendered += renderCardBatch(grid, visibleCars, savedIds, {
      start: rendered, count: PAGE_SIZE, comparedIds,
    });
    if (rendered >= visibleCars.length) {
      if (moreButton === providedMoreButton) moreButton.hidden = true;
      else moreButton?.remove();
      if (moreButton !== providedMoreButton) moreButton = null;
    } else if (moreButton) {
      const label = moreButton.querySelector('span') || moreButton;
      label.textContent = `Show ${Math.min(PAGE_SIZE, visibleCars.length - rendered)} more cars`;
    }
  }

  function installMoreButton() {
    if (!grid || rendered >= visibleCars.length) return;
    if (!moreButton) {
      moreButton = document.createElement('button');
      moreButton.type = 'button';
      moreButton.className = 'load-more';
      moreButton.dataset.action = 'show-more';
      grid.after(moreButton);
    }
    moreButton.hidden = false;
    const label = moreButton.querySelector('span') || moreButton;
    label.textContent = `Show ${Math.min(PAGE_SIZE, visibleCars.length - rendered)} more cars`;
  }

  function render({ updateHash = true } = {}) {
    if (sliderRenderFrame) {
      cancelAnimationFrame(sliderRenderFrame);
      sliderRenderFrame = 0;
    }
    visibleCars = filterCars(cars, filters, savedIds);
    rendered = 0;
    if (moreButton === providedMoreButton) moreButton.hidden = true;
    else moreButton?.remove();
    if (moreButton !== providedMoreButton) moreButton = null;
    if (grid) {
      grid.innerHTML = '';
      grid.setAttribute('aria-busy', 'false');
      if (visibleCars.length) {
        if (emptyState) emptyState.hidden = true;
        appendNextPage();
        installMoreButton();
      } else {
        if (emptyState) {
          const hasSavedCars = savedIds.size > 0;
          emptyState.innerHTML = filters.savedOnly && !hasSavedCars
            ? '<span class="state-panel__mark" aria-hidden="true">♥</span><h3>Your saved garage is empty.</h3><p>Tap the heart on any car to keep it here for later.</p><button class="poster-button" type="button" data-action="show-saved">Browse all cars</button>'
            : filters.savedOnly
              ? '<span class="state-panel__mark" aria-hidden="true">0</span><h3>None of your saved cars match this brief.</h3><p>Try browsing your saved garage without the other filters.</p><button class="poster-button" type="button" data-action="reset-filters">Clear filters</button>'
              : '<span class="state-panel__mark" aria-hidden="true">0</span><h3>No exact matches.</h3><p>Loosen one slider and we’ll bring the interesting stuff back.</p><button class="poster-button" type="button" data-action="reset-filters">Clear filters</button>';
          emptyState.hidden = false;
        }
        else grid.innerHTML = '<section class="empty-results"><p class="eyebrow">Zero matches</p><h2>Too picky? Loosen a slider.</h2><button type="button" data-action="reset">Reset the garage</button></section>';
      }
    }
    if (resultCount) resultCount.textContent = visibleCars.length.toLocaleString('en-GB');
    if (resultNoun) resultNoun.textContent = visibleCars.length === 1 ? ' match' : ' matches';
    if (search && search.value !== filters.query) search.value = filters.query;
    if (sort && sort.value !== filters.sort) sort.value = filters.sort;
    setButtonStates();
    filterMenus?.setFilters(filters);
    syncCompareUI();
    sliderBinding.sync();
    safeWrite(FILTERS_KEY, filters);
    if (updateHash && !location.hash.startsWith('#c/')) replaceHash(filtersToHash(filters));
  }

  function scheduleSliderRender() {
    if (sliderRenderFrame) return;
    sliderRenderFrame = requestAnimationFrame(() => {
      sliderRenderFrame = 0;
      render();
    });
  }

  let sliderBinding = bindSliderDeck(sliderDeck, filters, scheduleSliderRender);

  function syncDrawer() {
    if (!drawer) return;
    drawer.querySelectorAll('input[name="fuel"], input[name="body"]').forEach(input => {
      const { group, value } = canonicalFilter(input.name, input.value);
      input.checked = filters[group].includes(value);
    });
    const seats = drawer.querySelector('[name="seats"]');
    const boot = drawer.querySelector('[name="boot"]');
    const best = drawer.querySelector('[name="best"]');
    const onSale = drawer.querySelector('[name="onsale"]');
    if (seats) seats.value = String(filters.seatsMin);
    if (boot) boot.value = String(filters.bootMin);
    if (best) best.checked = filters.bestOnly;
    if (onSale) onSale.checked = filters.onSaleOnly;
  }

  function readDrawer() {
    if (!drawer) return;
    const oldEfficiencyMode = determineEfficiencyMode(filters);
    filters.fuels = [...drawer.querySelectorAll('input[name="fuel"]:checked')].map(input => canonicalFilter('fuel', input.value).value);
    filters.bodies = [...drawer.querySelectorAll('input[name="body"]:checked')].map(input => canonicalFilter('body', input.value).value);
    filters.seatsMin = Number(drawer.querySelector('[name="seats"]')?.value) || 0;
    filters.bootMin = Number(drawer.querySelector('[name="boot"]')?.value) || 0;
    filters.bestOnly = Boolean(drawer.querySelector('[name="best"]')?.checked);
    filters.onSaleOnly = Boolean(drawer.querySelector('[name="onsale"]')?.checked);
    if (oldEfficiencyMode !== determineEfficiencyMode(filters)) filters.efficiencyMin = 0;
  }

  function openCar(id, trigger) {
    const car = byId.get(id);
    if (!car) {
      toast('That car is no longer in this edition.', 'error');
      replaceHash(filtersToHash(filters));
      return;
    }
    const twins = findTwins(car, cars, { maxBudget: filters.budget[1], limit: 4 });
    const rivals = (car.rivals || []).map(id => byId.get(id)).filter(Boolean);
    comparison.close({ navigate: false });
    detail.open(car, twins, savedIds.has(car.id), trigger, rivals, comparedIds.has(car.id));
  }

  function openComparison({ updateHash = true } = {}) {
    if (comparedIds.size < 2) {
      toast(`Choose ${2 - comparedIds.size} more car${comparedIds.size ? '' : 's'} to compare.`);
      return false;
    }
    detail.close({ navigate: false });
    comparison.open([...comparedIds].map(id => byId.get(id)).filter(Boolean));
    if (updateHash) replaceHash(compareHash(comparedIds));
    syncCompareUI();
    return true;
  }

  detail.onClose(() => {
    if (location.hash.startsWith('#c/')) replaceHash(filtersToHash(filters));
  });
  comparison.onClose(() => {
    if (location.hash.startsWith('#compare/')) replaceHash(filtersToHash(filters));
  });

  function applyRoute() {
    const route = parseHash(location.hash);
    if (route.type === 'car') {
      const trigger = pendingDetailTrigger?.id === route.id
        ? pendingDetailTrigger.trigger
        : document.querySelector(`[data-car-id="${route.id}"] .car-card__link`);
      pendingDetailTrigger = null;
      openCar(route.id, trigger);
      return;
    }
    if (route.type === 'compare') {
      const routed = normalizeCompared(route.ids, validCarIds);
      if (routed.length < 2) {
        toast('That comparison no longer has two available cars.', 'error');
        replaceHash(filtersToHash(filters));
        return;
      }
      comparedIds = new Set(routed);
      saveCompared(comparedIds);
      syncCompareUI();
      openComparison({ updateHash: false });
      return;
    }
    detail.close({ navigate: false });
    comparison.close({ navigate: false });
    if (route.type === 'query') {
      filters = createFilters(route.filters);
      if (filters.sort === 'match') filters.sort = 'score';
      sliderBinding.destroy();
      sliderBinding = bindSliderDeck(sliderDeck, filters, scheduleSliderRender);
      render({ updateHash: false });
    }
  }

  let searchTimer;
  search?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filters.query = search.value.trim();
      render();
    }, 120);
  });
  search?.form?.addEventListener('submit', event => {
    event.preventDefault();
    clearTimeout(searchTimer);
    filters.query = search.value.trim();
    render();
  });
  sort?.addEventListener('change', () => {
    filters.sort = sort.value;
    render();
  });

  document.addEventListener('click', async event => {
    const saveButton = event.target.closest?.('[data-action="save"]');
    if (saveButton) {
      event.preventDefault();
      event.stopPropagation();
      const id = saveButton.dataset.id;
      savedIds = toggleSaved(id, savedIds);
      updateSavedButtons(document, id, savedIds.has(id));
      setButtonStates();
      toast(savedIds.has(id) ? 'Parked in your saved garage.' : 'Removed from your saved garage.');
      if (filters.savedOnly) render();
      return;
    }

    const compareButton = event.target.closest?.('[data-action="compare"][data-id]');
    if (compareButton) {
      event.preventDefault();
      event.stopPropagation();
      const id = compareButton.dataset.id;
      const previousCompared = [...comparedIds];
      const next = toggleCompared(id, comparedIds);
      if (next.full) {
        toast('Four cars is the limit. Remove one to add another.', 'error');
        return;
      }
      comparedIds = next.ids;
      saveCompared(comparedIds);
      syncCompareUI(id);
      if (compareDialog?.open) {
        if (comparedIds.size >= 2) {
          comparison.open([...comparedIds].map(item => byId.get(item)).filter(Boolean), {
            focusIndex: Math.max(0, previousCompared.indexOf(id)),
          });
          replaceHash(compareHash(comparedIds));
        }
        else comparison.close();
      }
      toast(comparedIds.has(id) ? 'Added to the comparison.' : 'Removed from the comparison.');
      return;
    }

    const filterButton = event.target.closest?.('[data-filter]');
    if (filterButton) {
      const kind = filterButton.dataset.filter;
      const { group, value } = canonicalFilter(kind, filterButton.dataset.value);
      if (['bodies', 'fuels', 'vibes', 'makes'].includes(group)) {
        const oldMode = determineEfficiencyMode(filters);
        Object.assign(filters, toggleFilterValue(filters, group, value));
        if (group === 'fuels' && oldMode !== determineEfficiencyMode(filters)) filters.efficiencyMin = 0;
      } else if (kind === 'best') filters.bestOnly = !filters.bestOnly;
      else if (kind === 'saved') filters.savedOnly = !filters.savedOnly;
      else if (kind === 'halo') filters.includeHalo = !filters.includeHalo;
      else if (kind === 'all') {
        Object.assign(filters, createFilters());
        if (search) search.value = '';
      }
      render();
      return;
    }

    const tab = event.target.closest?.('[data-tab]');
    if (tab) {
      if (tab.dataset.tab === 'saved') {
        filters.savedOnly = true;
        render();
        requestAnimationFrame(() => element('results')?.scrollIntoView({ block: 'start' }));
      }
      if (tab.dataset.tab === 'browse') {
        filters.savedOnly = false;
        render();
        requestAnimationFrame(() => element('results')?.scrollIntoView({ block: 'start' }));
      }
      if (tab.dataset.tab === 'filters') setDrawerOpen(drawer, true);
      if (tab.dataset.tab === 'compare') openComparison();
      return;
    }

    const action = event.target.closest?.('[data-action]')?.dataset.action;
    if (action === 'show-more' || action === 'load-more') appendNextPage();
    if (action === 'open-filters') { syncDrawer(); setDrawerOpen(drawer, true); }
    if (action === 'close-filters') setDrawerOpen(drawer, false);
    if (action === 'clear-search') {
      filters.query = '';
      if (search) search.value = '';
      render();
    }
    if (action === 'clear-bodies') {
      filters.bodies = [];
      render();
    }
    if (action === 'show-saved') {
      filters.savedOnly = !filters.savedOnly;
      render();
      if (event.target.closest('#empty-state')) requestAnimationFrame(() => {
        const visibleBrowseTab = [...document.querySelectorAll('[data-tab="browse"]')]
          .find(node => typeof node.getClientRects !== 'function' || node.getClientRects().length > 0);
        (visibleBrowseTab || element('results'))?.focus();
      });
    }
    if (action === 'open-compare') openComparison();
    if (action === 'clear-compare') {
      comparedIds = new Set();
      saveCompared(comparedIds);
      syncCompareUI();
      comparison.close();
      toast('Comparison cleared.');
    }
    if (action === 'retry-load') location.reload();
    if (action === 'apply-filters') {
      readDrawer();
      render();
    }
    if (action === 'reset-drawer') {
      Object.assign(filters, createFilters());
      syncDrawer();
      render();
    }
    if (action === 'reset' || action === 'reset-filters') {
      Object.assign(filters, createFilters());
      if (search) search.value = '';
      syncDrawer();
      render();
      toast('Fresh slate. All cars are back in play.');
      if (event.target.closest('#empty-state, .empty-results')) requestAnimationFrame(() => element('results')?.focus());
    }
    if (action === 'share') {
      const url = new URL(filtersToHash(filters), location.href).href;
      try {
        if (navigator.share) await navigator.share({ title: 'My Vroom shortlist', url });
        else { await navigator.clipboard.writeText(url); toast('Search link copied.'); }
      } catch (error) {
        if (error?.name !== 'AbortError') toast('Copy the current address to share this search.', 'error');
      }
    }
  });

  document.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) {
      const card = event.target.closest('[data-car-id]');
      const car = card ? byId.get(card.dataset.carId) : null;
      setImageFallback(event.target, car ? `${car.make} ${car.model}` : 'Vroom');
    }
  }, true);
  drawer?.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const focusable = [...drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter(node => !node.hidden && node.getAttribute('aria-hidden') !== 'true'
        && (typeof node.getClientRects !== 'function' || node.getClientRects().length > 0));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.addEventListener('hashchange', applyRoute);

  render({ updateHash: initialRoute.type === 'browse' });
  if (initialRoute.type === 'car') openCar(initialRoute.id);
  if (initialRoute.type === 'compare') {
    if (routedCompared.length >= 2) openComparison({ updateHash: false });
    else replaceHash(filtersToHash(filters));
  }
  showOnlyState('ready');
}

start().catch(error => {
  console.error(error);
  showOnlyState('error');
  const message = element('error-state')?.querySelector('[data-error-message]');
  if (message) message.textContent = error.message || 'The garage would not open. Try refreshing.';
  element('error-state')?.querySelector('[data-action="retry-load"]')?.addEventListener('click', () => location.reload());
});
