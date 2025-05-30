-- Stored Procedure: Toggle Like Status
DELIMITER ;;
CREATE PROCEDURE `sp_toggle_like`(
    IN p_user_id BIGINT,
    IN p_target_type ENUM('post','comment'),
    IN p_target_id BIGINT
)
BEGIN
    -- Check if already liked
    IF EXISTS (SELECT 1 FROM `likes` WHERE `user_id` = p_user_id AND `target_type` = p_target_type AND `target_id` = p_target_id) THEN
        -- If liked, delete the like record (unlike)
        DELETE FROM `likes`
        WHERE `user_id` = p_user_id
          AND `target_type` = p_target_type
          AND `target_id` = p_target_id;
    ELSE
        -- If not liked, insert new like record
        INSERT INTO `likes` (`user_id`, `target_type`, `target_id`, `create_at`)
        VALUES (p_user_id, p_target_type, p_target_id, NOW());
    END IF;
END;;
DELIMITER ;

-- Stored Procedure: Save Profile Visibility Settings
DELIMITER ;;
CREATE PROCEDURE `sp_save_profile_visibility`(
    IN p_user_id BIGINT,
    IN p_field_name VARCHAR(255),
    IN p_visible_to_admin_only TINYINT(1),
    IN p_visible_to_followers_only TINYINT(1),
    IN p_visible_to_all TINYINT(1)
)
BEGIN
    INSERT INTO `profilevisibility` (`user_id`, `field_name`, `visible_to_admin_only`, `visible_to_followers_only`, `visible_to_all`)
    VALUES (p_user_id, p_field_name, p_visible_to_admin_only, p_visible_to_followers_only, p_visible_to_all)
    ON DUPLICATE KEY UPDATE
        `visible_to_admin_only` = p_visible_to_admin_only,
        `visible_to_followers_only` = p_visible_to_followers_only,
        `visible_to_all` = p_visible_to_all;
END;;
DELIMITER ; 