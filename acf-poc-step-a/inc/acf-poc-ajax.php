<?php
if (!defined('ABSPATH')) exit;

add_action('wp_ajax_acfdpc_get_parent_info', 'acfdpc_get_parent_info');
add_action('wp_ajax_nopriv_acfdpc_get_parent_info', 'acfdpc_get_parent_info');
function acfdpc_get_parent_info(){
    check_ajax_referer('acfdpc_nonce','nonce');

    $parent_id = isset($_POST['parent_id']) ? absint($_POST['parent_id']) : 0;
    $meta_key  = isset($_POST['meta']) ? sanitize_text_field($_POST['meta']) : '';
    $val = '';

    if ($parent_id && $meta_key){
        if (function_exists('get_field')) {
            $tmp = get_field($meta_key, $parent_id);
            if ($tmp !== null && $tmp !== false) $val = $tmp;
        }
        if ($val === '' || $val === null) {
            $val = get_post_meta($parent_id, $meta_key, true);
        }
    }

    wp_send_json(['ok'=> (bool)$val, 'id'=>$parent_id, 'meta'=>$meta_key, 'val'=>$val]);
}

add_action('init', function(){
    $map = acfdpc_get_mapping_step_b();

    foreach ($map as $g){
        $pass        = isset($g['pass']) ? (array)$g['pass'] : [];
        $link_meta   = isset($g['link_meta']) ? $g['link_meta'] : '';
        $reverse_key = isset($g['reverse_link_on_parent']) ? $g['reverse_link_on_parent'] : '';

        foreach ($pass as $child_key){
            add_filter('acf/fields/relationship/query/key='.$child_key, function($args, $field = null, $post_id = 0) use ($link_meta, $reverse_key){
                $company_id = isset($_POST['company_id']) ? absint($_POST['company_id']) : 0;
                if (!$company_id) return $args;

                if (!empty($link_meta)) {
                    $keys = is_array($link_meta) ? array_filter(array_map('sanitize_key', $link_meta)) : [sanitize_key($link_meta)];
                    if ($keys) {
                        $or = ['relation' => 'OR'];
                        foreach ($keys as $k) {
                            $or[] = ['key' => $k, 'value' => $company_id,             'compare' => '='];
                            $or[] = ['key' => $k, 'value' => '"' . $company_id . '"', 'compare' => 'LIKE'];
                        }
                        if (!isset($args['meta_query'])) $args['meta_query'] = [];
                        $args['meta_query'][] = $or;
                    }
                } elseif (!empty($reverse_key) && function_exists('get_field')) {
                    $ids = (array) get_field($reverse_key, $company_id);
                    $ids = array_filter(array_map('absint', $ids));
                    $args['post__in'] = $ids ?: [0];
                    $args['orderby']  = 'post__in';
                }

                $args['update_post_meta_cache'] = false;
                $args['update_post_term_cache'] = false;
                $args['cache_results']          = false;

                return $args;
            }, 10, 3);
        }
    }
});