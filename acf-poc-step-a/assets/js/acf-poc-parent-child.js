(function(){
  if (typeof window.ACFDPC === 'undefined' || !ACFDPC.mapping) return;

  function waitForACF(cb, tries=60){
    const t = setInterval(()=>{
      if (window.acf && typeof acf.getField === 'function'){ clearInterval(t); cb(); }
      else if (--tries <= 0){ clearInterval(t); }
    }, 500);
  }

  // Lit le libellé affiché dans la sélection actuelle du Relationship parent
  function readLabelFromDOM(acfField){
    const $ = window.jQuery || window.$;
    return $(acfField.$el).find('.acf-relationship .values .acf-rel-item').first().text().trim() || '';
  }

  // Extrait le nom avant " – SIRET" ; ex. "NIGAO – 80025634900013" -> "NIGAO"
  function onlyCompanyName(label){
    if (!label) return '';
    const parts = String(label).split('–');
    return (parts[0] || label).trim();
  }

  function getSearchInput($wrap){
    const $ = window.jQuery || window.$;
    return $wrap.find(
      '.acf-relationship .filters .filter.-search input, ' +
      '.acf-relationship .filters .-search input, ' +
      '.acf-relationship .filter.-search input'
    ).first();
  }

  // Tape (ou efface) le terme dans la barre de recherche du Relationship (ACF natif)
  function typeInRelationshipSearch(childField, term){
    const $ = window.jQuery || window.$;
    const $wrap = $(childField.$el);
    const $input = getSearchInput($wrap);
    if (!$input.length) return;

    $input.focus();
    $input.val('');
    $input.trigger('input');

    if (term){
      setTimeout(()=>{
        $input.val(term);
        $input.trigger('input');
        $input.trigger(jQuery.Event('keyup', { which: 13, keyCode: 13 }));
        $input.trigger('change');
      }, 50);
    }
  }

  // Force ACF à recharger la liste complète (poke input)
  function refreshRelationshipList(childField){
    const $ = window.jQuery || window.$;
    const $wrap = $(childField.$el);
    const $input = getSearchInput($wrap);
    if (!$input.length) return;

    $input.focus();
    $input.val(' ');
    $input.trigger('input');
    $input.trigger(jQuery.Event('keyup', { which: 32, keyCode: 32 }));

    setTimeout(()=>{
      $input.val('');
      $input.trigger('input');
      $input.trigger(jQuery.Event('keyup', { which: 8, keyCode: 8 }));
      $wrap.find('.acf-relationship .list').scrollTop(0);
    }, 80);
  }

  // Déselectionne les items + efface la recherche + force refresh
  function clearRelationship(childField){
    const $ = window.jQuery || window.$;
    try { childField.val([]); childField.render && childField.render(); } catch(e){}
    $(childField.$el).find('.values .acf-rel-item .-remove, .values .acf-rel-item .remove').each(function(){ $(this).trigger('click'); });
    typeInRelationshipSearch(childField, '');
    setTimeout(()=>refreshRelationshipList(childField), 80);
  }

  function setTextField(childField, value){
    try { childField.val(value); childField.render && childField.render(); } catch(e){}
  }

  function isParentEmpty(parentField){
    const $ = window.jQuery || window.$;
    const hasDomSelection = $(parentField.$el).find('.acf-relationship .values .acf-rel-item').length > 0;
    const val = parentField.val();
    const emptyVal = !val || (Array.isArray(val) && val.length === 0);
    return !hasDomSelection && emptyVal;
  }

  function bindGroup(group){
    const parentKey = group.listen;
    const parent = acf.getField(parentKey);
    if (!parent) return;

    let lastCompany = null;

    function applyResetToChildren(){
      (group.fill || []).forEach(row=>{
        const child = acf.getField(row.acf_key);
        if (!child) return;
        if (child.get('type') === 'relationship') clearRelationship(child);
        else setTextField(child, '');
      });
    }

    function onParentChange(){
      if (isParentEmpty(parent)){
        lastCompany = null;
        applyResetToChildren();
        return;
      }

      const label = readLabelFromDOM(parent);
      const company = onlyCompanyName(label);
      if (!company || company === lastCompany) return;
      lastCompany = company;

      (group.fill || []).forEach(row=>{
        const child = acf.getField(row.acf_key);
        if (!child) return;

        if (child.get('type') === 'relationship'){
          clearRelationship(child);
          setTimeout(()=>typeInRelationshipSearch(child, company), 150);
        } else {
          setTextField(child, company);
        }
      });
    }

    // Bind + observateur DOM (capture la suppression silencieuse)
    setTimeout(onParentChange, 0);
    parent.on('change', onParentChange);

    const $ = window.jQuery || window.$;
    const valuesEl = $(parent.$el).find('.acf-relationship .values')[0];
    if (valuesEl){
      const mo = new MutationObserver(()=>{ onParentChange(); });
      mo.observe(valuesEl, { childList: true, subtree: true });
    }
  }

  function init(){
    Object.keys(ACFDPC.mapping).forEach(slug=>{
      bindGroup(ACFDPC.mapping[slug]);
    });
  }

  waitForACF(init);
})();
