(function(){
  var DEBUG = false;
  function log(){ if(DEBUG) console.log.apply(console, ['[ACFDPC]'].concat([].slice.call(arguments))); }
  function warn(){ if(DEBUG) console.warn.apply(console, ['[ACFDPC]'].concat([].slice.call(arguments))); }
  function err(){ if(DEBUG) console.error.apply(console, ['[ACFDPC]'].concat([].slice.call(arguments))); }

  function waitForACF(cb, tries){
    var t = setInterval(function(){
      var ok = !!(window.jQuery && window.acf && typeof acf.getField==='function' && window.ACFDPC && ACFDPC.mapping);
      if(ok){ clearInterval(t); cb(); }
      else if((tries=(tries||60)-1)<=0){ clearInterval(t); }
    }, 500);
  }

  function getSearchInput($wrap){
    var $=jQuery;
    return $wrap.find('.acf-relationship .filters .filter.-search input, .acf-relationship .filters .-search input, .acf-relationship .filter.-search input').first();
  }

  function typeInRelationshipSearch(field, term){
    var $=jQuery, $w=$(field.$el), $i=getSearchInput($w);
    if(!$i.length){ return; }
    $i.focus(); $i.val(''); $i.trigger('input');
    if(term){
      setTimeout(function(){
        $i.val(term);
        $i.trigger('input');
        $i.trigger(jQuery.Event('keyup',{which:13,keyCode:13}));
        $i.trigger('change');
      }, 60);
    }
  }

  function refreshRelationshipList(field){
    var $=jQuery, $w=$(field.$el), $i=getSearchInput($w);
    if(!$i.length){ return; }
    $i.focus();
    $i.val(' ');
    $i.trigger('input');
    $i.trigger(jQuery.Event('keyup',{which:32,keyCode:32}));
    setTimeout(function(){
      $i.val('');
      $i.trigger('input');
      $i.trigger(jQuery.Event('keyup',{which:8,keyCode:8}));
      $w.find('.acf-relationship .list').scrollTop(0);
    }, 80);
  }

  function clearRelationship(field){
    var $=jQuery;
    try{ field.val([]); if(field.render) field.render(); }catch(e){}
    var $w=$(field.$el);
    $w.find('.values .acf-rel-item .-remove, .values .acf-rel-item .remove').each(function(){ $(this).trigger('click'); });
    typeInRelationshipSearch(field,'');
    setTimeout(function(){ refreshRelationshipList(field); }, 80);
  }

  function setTextField(field, val){
    try{ field.val(val); if(field.render) field.render(); }catch(e){}
  }

  function readSelectionFromDOM(parentField){
    var $=jQuery, $el=$(parentField.$el), $item = $el.find('.acf-relationship .values .acf-rel-item').first();
    var id = 0, label = '';
    if ($item.length){ id = parseInt($item.attr('data-id'),10) || 0; label = $item.text().trim(); return { id:id||0, label:label||'' }; }
    var $hidden = $el.find('input[type=hidden][name^="acf["]');
    if ($hidden.length){
      var raw = $hidden.val();
      if (raw){ var m = String(raw).match(/\d+/); if (m) id = parseInt(m[0],10) || 0; }
    }
    return { id: id||0, label: '' };
  }
  function readLabelFromDOM(parentField){
    var $=jQuery; return $(parentField.$el).find('.acf-relationship .values .acf-rel-item').first().text().trim() || '';
  }

  function ajaxGetName(id, meta){
    return jQuery.post(ACFDPC.ajax,{ action:'acfdpc_get_parent_info', nonce:ACFDPC.nonce, parent_id:id, meta:meta });
  }

  function debounce(fn, ms){ var to=null; return function(){ var ctx=this, args=arguments; clearTimeout(to); to=setTimeout(function(){ fn.apply(ctx,args); }, ms); }; }

  function bindGroup(group){
    var parentKey = group.listen;
    var parent = acf.getField(parentKey);
    if(!parent){ return; }

    var mem = { id:0, name:'' };
    var onChangeDebounced = debounce(onChange, 120);

    function applyReset(){
      (group.fill||[]).forEach(function(row){
        var f=acf.getField(row.acf_key);
        if(!f){ return; }
        if(f.get('type')==='relationship') clearRelationship(f);
        else setTextField(f,'');
      });
    }

    function resolveParentIdAndLabel(){
      var v=parent.val();
      var id = Array.isArray(v) ? (v[0]||0) : (v||0);
      var label = readLabelFromDOM(parent);
      if(!id){
        var dom = readSelectionFromDOM(parent);
        id = dom.id || id;
        if(!label) label = dom.label || label;
      }
      return {id:id||0, label:label||''};
    }

    function onChange(){
      var s = resolveParentIdAndLabel();
      if(!s.id){
        mem.id=0; mem.name='';
        applyReset();
        return;
      }

      if(s.id===mem.id && mem.name){
        (group.fill||[]).forEach(function(row){
          var f=acf.getField(row.acf_key); if(!f) return;
          if(f.get('type')==='relationship'){ typeInRelationshipSearch(f, mem.name); }
          else { setTextField(f, mem.name); }
        });
        return;
      }

      mem.id=s.id;
      var first = (group.fill&&group.fill[0]) ? group.fill[0] : null;
      var meta = first ? first.with_parent_key : '';
      ajaxGetName(s.id, meta).done(function(res){
        mem.name = (res&&res.ok&&res.val) ? res.val : '';
        (group.fill||[]).forEach(function(row){
          var f=acf.getField(row.acf_key);
          if(!f){ return; }
          if(f.get('type')==='relationship'){
            try{ f.val([]); if(f.render) f.render(); }catch(e){}
            typeInRelationshipSearch(f, mem.name);
          } else {
            setTextField(f, mem.name);
          }
        });
      });
    }

    setTimeout(onChange, 0);
    parent.on('change', onChangeDebounced);

    var $=jQuery, $wrap=$(parent.$el);
    $wrap.on('click', '.acf-relationship .list .acf-rel-item', function(){ onChangeDebounced(); });
    $wrap.on('click', '.acf-relationship .values .acf-rel-item .-remove, .acf-relationship .values .acf-rel-item .remove', function(){ onChangeDebounced(); });

    var valuesEl=$wrap.find('.acf-relationship .values')[0];
    if(valuesEl){ var mo=new MutationObserver(function(){ onChangeDebounced(); }); mo.observe(valuesEl,{childList:true,subtree:true}); }

    acf.addFilter('relationship_ajax_data', function(data, field){
      var key = field && field.get ? field.get('key') : null;
      if ((group.pass||[]).indexOf(key)!==-1){ data.company_id = mem.id||0; }
      return data;
    });
    acf.addFilter('select2_ajax_data', function(data, args, $input, field){
      var key = field && field.get ? field.get('key') : null;
      if ((group.pass||[]).indexOf(key)!==-1){ data.company_id = mem.id||0; }
      return data;
    });
  }

  function init(){
    var mapping = ACFDPC.mapping || {};
    Object.keys(mapping).forEach(function(slug){ bindGroup(mapping[slug]); });
  }

  waitForACF(init);
})();