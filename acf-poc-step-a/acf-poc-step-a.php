<?php
/**
 * Plugin Name: ACF POC Step A – Parent/Child (Front-only)
 * Description: Dépendance ACF parent→child, préfill côté client, mapping PHP. Étape A (PoC), sans AJAX.
 * Version: 1.2.0
 * Author: Consalvi Mathieu
 * License: GPL-2.0+
 *
 * GitHub Plugin URI: Math44/acf-poc-step-a
 * Primary Branch: main
 */

if (!defined('ABSPATH')) exit;

require_once __DIR__ . '/inc/acf-poc-map.php';

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script(
        'acf-poc-parent-child',
        plugin_dir_url(__FILE__) . 'assets/js/acf-poc-parent-child.js',
        ['jquery'],
        '1.2.0',
        true
    );

    wp_localize_script('acf-poc-parent-child', 'ACFDPC', [
        'mapping' => acfdpc_get_mapping_step_a(),
    ]);
});