<?php
/**
 * Plugin Name: ACF POC Parent/Child
 * Description: Dépendance ACF parent→child (Étape B) : AJAX + filtre serveur (scalable).
 * Version: 2.0.8
 * Author: Consalvi Mathieu
 * License: GPL-2.0+
 * GitHub Plugin URI: Math44/acf-poc-step-a
 * Primary Branch: main
 */

if (!defined('ABSPATH')) exit;

require_once __DIR__ . '/inc/acf-poc-map.php';
require_once __DIR__ . '/inc/acf-poc-ajax.php';

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_script(
        'acf-poc-parent-child',
        plugin_dir_url(__FILE__) . 'assets/js/acf-poc-parent-child.js',
        ['jquery', 'acf-input'],
        '2.0.8',
        true
    );

    wp_localize_script('acf-poc-parent-child', 'ACFDPC', [
        'ajax'    => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('acfdpc_nonce'),
        'mapping' => acfdpc_get_mapping_step_b(),
    ]);
});
