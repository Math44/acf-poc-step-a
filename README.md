1) Installation (2 options)
   
Option A – via Git Updater

Option B – copie dans le thème (si tu préféres sans plugin) :

  Copier inc/acf-poc-map.php et assets/js/acf-poc-parent-child.js dans le thème/child-thème.
  Ajouter dans functions.php :
  
      require_once __DIR__ . '/inc/acf-poc-map.php';
      add_action('wp_enqueue_scripts', function () {
          wp_enqueue_script(
              'acf-poc-parent-child',
              get_stylesheet_directory_uri() . '/assets/js/acf-poc-parent-child.js',
              ['jquery'],
              '1.2.0',
              true
          );
          wp_localize_script('acf-poc-parent-child', 'ACFDPC', [
              'mapping' => acfdpc_get_mapping_step_a(),
          ]);
      });

2) Procédure de test 

Ouvrir la page front qui contient le acf_form().
Dans [EE] Entreprise, choisir “NIGAO – 800…”.
Attendu : les champs [EE] Responsable des travaux et [EE] Intervenants s’ouvrent et se filtrent automatiquement par “NIGAO” (barre de recherche renseignée).

Désélectionner l’entreprise (retirer la sélection).
Attendu : reset complet des deux enfants (sélections vidées, recherche effacée, liste rechargée).

Re-sélectionner une autre entreprise → le filtrage se met à jour en conséquence.
