<?php
if (!defined('ABSPATH')) exit;

function acfdpc_get_mapping_step_b() {
    return [
        'field_0' => [
            // Parent (entreprise)
            'listen' => 'field_67adcdee9b359',

            // Enfants
            'fill' => [
                ['acf_key' => 'field_67af55a17dc2e', 'with_parent_key' => 'field_67aa84b2a249c'], // [EE] Responsable des travaux
                ['acf_key' => 'field_67af5a078d03b', 'with_parent_key' => 'field_67aa84b2a249c'], // [EE] Intervenants
            ],

            // Relationship enfants à filtrer côté serveur
            'pass' => ['field_67af55a17dc2e','field_67af5a078d03b'],

            // Méta de liaison "personne / entreprise"
            'link_meta' => ['nw_people_corporation', 'pdp_external_corporation'],

        ],
    ];
}
