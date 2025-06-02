/*
Navicat MySQL Data Transfer

Source Server         : DataBaseHomeWork
Source Server Version : 80019
Source Host           : localhost:3306
Source Database       : mybbs

Target Server Type    : MYSQL
Target Server Version : 80019
File Encoding         : 65001

Date: 2025-06-02 10:29:41
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `belonging_to`
-- ----------------------------
DROP TABLE IF EXISTS `belonging_to`;
CREATE TABLE `belonging_to` (
  `section_id` int unsigned NOT NULL,
  `post_id` bigint NOT NULL,
  PRIMARY KEY (`section_id`,`post_id`),
  KEY `fk_belong_post` (`post_id`),
  CONSTRAINT `fk_belong_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`),
  CONSTRAINT `fk_belong_section` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of belonging_to
-- ----------------------------
INSERT INTO `belonging_to` VALUES ('1', '4');
INSERT INTO `belonging_to` VALUES ('2', '12');
INSERT INTO `belonging_to` VALUES ('1', '13');
INSERT INTO `belonging_to` VALUES ('5', '14');
INSERT INTO `belonging_to` VALUES ('5', '16');
INSERT INTO `belonging_to` VALUES ('1', '19');

-- ----------------------------
-- Table structure for `blockrelation`
-- ----------------------------
DROP TABLE IF EXISTS `blockrelation`;
CREATE TABLE `blockrelation` (
  `blocker_id` bigint NOT NULL,
  `blocked_id` bigint NOT NULL,
  `block_time` datetime DEFAULT NULL,
  PRIMARY KEY (`blocker_id`,`blocked_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of blockrelation
-- ----------------------------
INSERT INTO `blockrelation` VALUES ('4', '3', null);

-- ----------------------------
-- Table structure for `blockvisibility`
-- ----------------------------
DROP TABLE IF EXISTS `blockvisibility`;
CREATE TABLE `blockvisibility` (
  `blocker_id` bigint NOT NULL,
  `blocked_id` bigint NOT NULL,
  `field_name` varchar(255) NOT NULL,
  PRIMARY KEY (`blocker_id`,`blocked_id`,`field_name`),
  KEY `fk_block_field` (`field_name`),
  CONSTRAINT `fk_block_field` FOREIGN KEY (`field_name`) REFERENCES `profilevisibility` (`field_name`),
  CONSTRAINT `fk_block_rel` FOREIGN KEY (`blocker_id`, `blocked_id`) REFERENCES `blockrelation` (`blocker_id`, `blocked_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of blockvisibility
-- ----------------------------

-- ----------------------------
-- Table structure for `comment`
-- ----------------------------
DROP TABLE IF EXISTS `comment`;
CREATE TABLE `comment` (
  `comment_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `post_id` bigint NOT NULL,
  `content` text,
  `create_at` datetime DEFAULT NULL,
  `parent_comment_id` bigint DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `fk_comment_user` (`user_id`),
  KEY `fk_comment_post` (`post_id`),
  KEY `fk_comment_parent` (`parent_comment_id`),
  CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `comment` (`comment_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`),
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of comment
-- ----------------------------
INSERT INTO `comment` VALUES ('1', '4', '2', '该我了！', '2025-05-27 22:53:30', null);
INSERT INTO `comment` VALUES ('3', '4', '4', '111', '2025-05-28 10:45:12', null);
INSERT INTO `comment` VALUES ('6', '2', '13', '支持密码事业蓬勃发展！', '2025-05-30 01:40:25', null);
INSERT INTO `comment` VALUES ('7', '4', '13', '你是谁？', '2025-05-30 01:43:09', null);
INSERT INTO `comment` VALUES ('9', '4', '12', '蒸蒸日上！', '2025-05-30 20:29:23', null);
INSERT INTO `comment` VALUES ('10', '5', '2', '支持管理员！', '2025-05-30 20:41:02', null);
INSERT INTO `comment` VALUES ('11', '5', '2', '你也是回复上了', '2025-05-30 21:15:15', '1');
INSERT INTO `comment` VALUES ('12', '5', '14', '我想要！', '2025-05-30 21:22:54', null);
INSERT INTO `comment` VALUES ('14', '4', '14', 'hhhei', '2025-05-31 01:27:38', '12');
INSERT INTO `comment` VALUES ('15', '4', '13', 'ttt!', '2025-05-31 01:28:21', '6');
INSERT INTO `comment` VALUES ('16', '4', '2', '嘻嘻嘻', '2025-05-31 01:39:17', '11');
INSERT INTO `comment` VALUES ('17', '4', '2', '请为', '2025-05-31 01:48:10', '11');
INSERT INTO `comment` VALUES ('18', '4', '16', '顿顿求题', '2025-05-31 15:28:46', null);

-- ----------------------------
-- Table structure for `followrelation`
-- ----------------------------
DROP TABLE IF EXISTS `followrelation`;
CREATE TABLE `followrelation` (
  `follower_id` bigint NOT NULL,
  `followed_id` bigint NOT NULL,
  `follow_time` datetime DEFAULT NULL,
  PRIMARY KEY (`follower_id`,`followed_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of followrelation
-- ----------------------------
INSERT INTO `followrelation` VALUES ('3', '4', null);
INSERT INTO `followrelation` VALUES ('3', '5', null);
INSERT INTO `followrelation` VALUES ('4', '3', null);
INSERT INTO `followrelation` VALUES ('4', '5', null);
INSERT INTO `followrelation` VALUES ('5', '4', null);

-- ----------------------------
-- Table structure for `followvisibility`
-- ----------------------------
DROP TABLE IF EXISTS `followvisibility`;
CREATE TABLE `followvisibility` (
  `follower_id` bigint NOT NULL,
  `followed_id` bigint NOT NULL,
  `field_name` varchar(255) NOT NULL,
  PRIMARY KEY (`follower_id`,`followed_id`,`field_name`),
  KEY `fk_follow_field` (`field_name`),
  CONSTRAINT `fk_follow_field` FOREIGN KEY (`field_name`) REFERENCES `profilevisibility` (`field_name`),
  CONSTRAINT `fk_follow_rel` FOREIGN KEY (`follower_id`, `followed_id`) REFERENCES `followrelation` (`follower_id`, `followed_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of followvisibility
-- ----------------------------

-- ----------------------------
-- Table structure for `levelrule`
-- ----------------------------
DROP TABLE IF EXISTS `levelrule`;
CREATE TABLE `levelrule` (
  `level_id` bigint NOT NULL,
  `level_name` varchar(255) DEFAULT NULL,
  `min_exp` bigint DEFAULT NULL,
  PRIMARY KEY (`level_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of levelrule
-- ----------------------------
INSERT INTO `levelrule` VALUES ('1', '预备役', '0');
INSERT INTO `levelrule` VALUES ('2', '战士', '100');
INSERT INTO `levelrule` VALUES ('3', '排长', '500');
INSERT INTO `levelrule` VALUES ('4', '连长', '1000');
INSERT INTO `levelrule` VALUES ('5', '营长', '2000');
INSERT INTO `levelrule` VALUES ('6', '团长', '4000');
INSERT INTO `levelrule` VALUES ('7', '旅长', '7000');
INSERT INTO `levelrule` VALUES ('8', '师长', '12000');
INSERT INTO `levelrule` VALUES ('9', '军长', '18000');
INSERT INTO `levelrule` VALUES ('10', '司令', '25000');

-- ----------------------------
-- Table structure for `likes`
-- ----------------------------
DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes` (
  `like_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `target_type` enum('post','comment') DEFAULT NULL,
  `target_id` bigint DEFAULT NULL,
  `create_at` datetime DEFAULT NULL,
  PRIMARY KEY (`like_id`),
  UNIQUE KEY `uk_user_target` (`user_id`,`target_type`,`target_id`),
  KEY `fk_like_user` (`user_id`),
  CONSTRAINT `fk_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of likes
-- ----------------------------
INSERT INTO `likes` VALUES ('15', '3', 'post', '4', '2025-05-28 10:46:04');
INSERT INTO `likes` VALUES ('17', '3', 'post', '2', '2025-05-28 10:49:33');
INSERT INTO `likes` VALUES ('29', '5', 'post', '4', '2025-05-29 16:54:10');
INSERT INTO `likes` VALUES ('47', '4', 'comment', '6', '2025-05-30 09:27:14');
INSERT INTO `likes` VALUES ('50', '4', 'post', '4', '2025-05-30 09:32:03');
INSERT INTO `likes` VALUES ('52', '4', 'post', '2', '2025-05-30 17:55:21');
INSERT INTO `likes` VALUES ('53', '4', 'comment', '1', '2025-05-30 17:55:25');
INSERT INTO `likes` VALUES ('55', '5', 'post', '2', '2025-05-30 20:40:50');
INSERT INTO `likes` VALUES ('56', '5', 'post', '12', '2025-05-30 21:22:36');
INSERT INTO `likes` VALUES ('57', '5', 'post', '13', '2025-05-30 21:22:39');
INSERT INTO `likes` VALUES ('59', '3', 'post', '13', '2025-05-30 21:35:21');
INSERT INTO `likes` VALUES ('60', '3', 'comment', '12', '2025-05-30 22:02:39');
INSERT INTO `likes` VALUES ('73', '3', 'post', '16', '2025-05-31 14:23:01');
INSERT INTO `likes` VALUES ('81', '4', 'post', '12', '2025-05-31 14:59:21');
INSERT INTO `likes` VALUES ('86', '4', 'post', '13', '2025-05-31 15:21:42');
INSERT INTO `likes` VALUES ('101', '4', 'comment', '18', '2025-05-31 15:51:38');
INSERT INTO `likes` VALUES ('102', '4', 'post', '14', '2025-05-31 15:56:48');
INSERT INTO `likes` VALUES ('104', '4', 'post', '16', '2025-05-31 21:00:49');
INSERT INTO `likes` VALUES ('109', '7', 'post', '16', '2025-05-31 22:24:26');
INSERT INTO `likes` VALUES ('110', '7', 'comment', '18', '2025-05-31 22:28:28');
INSERT INTO `likes` VALUES ('121', '4', 'post', '19', '2025-06-02 10:12:04');

-- ----------------------------
-- Table structure for `post`
-- ----------------------------
DROP TABLE IF EXISTS `post`;
CREATE TABLE `post` (
  `post_id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `content` text,
  `create_at` datetime DEFAULT NULL,
  `post_time` datetime DEFAULT NULL,
  PRIMARY KEY (`post_id`),
  KEY `fk_post_user` (`user_id`),
  CONSTRAINT `fk_post_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of post
-- ----------------------------
INSERT INTO `post` VALUES ('2', '2', '技术分享', '分享我的Next.js学习心得', '2025-05-19 11:00:00', '2025-05-19 11:00:00');
INSERT INTO `post` VALUES ('4', '4', 'qwe', 'sda', '2025-05-27 22:50:47', '2025-05-27 22:50:47');
INSERT INTO `post` VALUES ('12', '5', '计科', '南开大学计算机学院', '2025-05-29 16:15:31', '2025-05-29 16:15:31');
INSERT INTO `post` VALUES ('13', '5', '123', '南开大学密码与网络空间安全学院', '2025-05-29 17:04:43', '2025-05-29 17:04:43');
INSERT INTO `post` VALUES ('14', '4', '出书！', '有朋友想买书吗？价格便宜，后台私信我！', '2025-05-30 09:23:34', '2025-05-30 09:23:34');
INSERT INTO `post` VALUES ('16', '3', '出复习资料', '毛概马原资料，价格可议！', '2025-05-31 13:38:33', '2025-05-31 13:38:33');
INSERT INTO `post` VALUES ('19', '4', '吃饭！', '疯狂星期四', '2025-06-01 14:14:59', '2025-06-01 14:14:59');

-- ----------------------------
-- Table structure for `profilevisibility`
-- ----------------------------
DROP TABLE IF EXISTS `profilevisibility`;
CREATE TABLE `profilevisibility` (
  `field_name` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  `visible_to_admin_only` tinyint(1) DEFAULT NULL,
  `visible_to_followers_only` tinyint(1) DEFAULT NULL,
  `visible_to_all` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`field_name`),
  KEY `fk_visibility_user` (`user_id`),
  KEY `idx_field_name` (`field_name`),
  CONSTRAINT `fk_visibility_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of profilevisibility
-- ----------------------------
INSERT INTO `profilevisibility` VALUES ('blocked_list', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('experience', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('followers_list', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('following_list', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('level', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('major', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('profileBase', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('recent_posts', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('registrationDate', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('stats', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('studentId', '4', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('blocked_list', '5', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('experience', '5', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('followers_list', '5', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('following_list', '5', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('level', '5', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('major', '5', '0', '1', '0');
INSERT INTO `profilevisibility` VALUES ('profileBase', '5', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('recent_posts', '5', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('registrationDate', '5', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('stats', '5', '0', '0', '1');
INSERT INTO `profilevisibility` VALUES ('studentId', '5', '0', '1', '0');

-- ----------------------------
-- Table structure for `section`
-- ----------------------------
DROP TABLE IF EXISTS `section`;
CREATE TABLE `section` (
  `section_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `section_name` varchar(255) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`section_id`),
  KEY `fk_section_creator` (`user_id`),
  CONSTRAINT `fk_section_creator` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of section
-- ----------------------------
INSERT INTO `section` VALUES ('1', null, '校园生活', '分享校园日常生活、活动和趣事');
INSERT INTO `section` VALUES ('2', null, '学术交流', '讨论学术问题、分享学习资源和经验');
INSERT INTO `section` VALUES ('3', null, '社团活动', '发布社团活动信息、招新和活动回顾');
INSERT INTO `section` VALUES ('4', null, '失物招领', '发布校园内丢失和拾获物品的信息');
INSERT INTO `section` VALUES ('5', null, '二手交易', '发布二手物品交易信息');
INSERT INTO `section` VALUES ('6', null, '情感交友', null);

-- ----------------------------
-- Table structure for `userisadmin`
-- ----------------------------
DROP TABLE IF EXISTS `userisadmin`;
CREATE TABLE `userisadmin` (
  `user_id` bigint NOT NULL,
  `is_admin` tinyint(1) NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_admin_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of userisadmin
-- ----------------------------
INSERT INTO `userisadmin` VALUES ('2', '1');
INSERT INTO `userisadmin` VALUES ('3', '0');
INSERT INTO `userisadmin` VALUES ('4', '0');
INSERT INTO `userisadmin` VALUES ('5', '0');
INSERT INTO `userisadmin` VALUES ('6', '0');
INSERT INTO `userisadmin` VALUES ('7', '0');
INSERT INTO `userisadmin` VALUES ('9', '0');
INSERT INTO `userisadmin` VALUES ('10', '0');
INSERT INTO `userisadmin` VALUES ('11', '0');
INSERT INTO `userisadmin` VALUES ('12', '0');
INSERT INTO `userisadmin` VALUES ('13', '0');

-- ----------------------------
-- Table structure for `users`
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT,
  `identity_id` bigint DEFAULT NULL,
  `level_id` bigint NOT NULL,
  `student_id` bigint DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `major` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `experience` bigint DEFAULT NULL,
  `level` int DEFAULT NULL,
  `following_count` int DEFAULT '0',
  `follower_count` int DEFAULT '0',
  `blocker_count` int DEFAULT '0',
  `blocked_count` int DEFAULT '0',
  PRIMARY KEY (`user_id`),
  KEY `fk_user_level` (`level_id`),
  CONSTRAINT `fk_user_level` FOREIGN KEY (`level_id`) REFERENCES `levelrule` (`level_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('2', null, '1', null, 'fdsa', null, '8909-0-9', '0', '1', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('3', null, '2', '2131421', 'ALM', 'Computer Science', 'qpalz,da', '105', '1', '2', '2', '0', '1');
INSERT INTO `users` VALUES ('4', null, '1', '134452', 'Pity', 'Finance', '10erosf', '24', '1', '1', '1', '1', '0');
INSERT INTO `users` VALUES ('5', null, '1', '2311100', '2311100', '物联网', '123456', '3', '1', '0', '1', '0', '0');
INSERT INTO `users` VALUES ('6', null, '1', '2324354', 'Big', '金融', 'qweasd', '0', '1', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('7', null, '1', '2248392', 'Smalls', '经济', '102938', '0', '1', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('9', null, '1', '2190453', 'adswqe', '历史学', '12qwaszx', '0', '1', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('10', null, '1', '2098456', 'KNN', '法学', 'zmxncbv', '0', '1', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('11', null, '1', '1234567', '2190456', '汉语言', 'qazwsx', '0', '1', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('12', null, '1', '2409586', 'xixihaha', '数学', 'qwpoeiru', '0', '1', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('13', null, '1', '2190456', 'bayes', '统计学', 'alskdjfh', '0', '1', '0', '0', '0', '0');

-- ----------------------------
-- View structure for `post_details_view`
-- ----------------------------
DROP VIEW IF EXISTS `post_details_view`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `post_details_view` AS select `p`.`post_id` AS `post_id`,`p`.`user_id` AS `user_id`,`p`.`title` AS `title`,`p`.`content` AS `content`,`p`.`create_at` AS `create_at`,`p`.`post_time` AS `post_time`,`u`.`username` AS `author_username`,`s`.`section_id` AS `section_id`,`s`.`section_name` AS `section_name`,(select count(0) from `comment` `c` where (`c`.`post_id` = `p`.`post_id`)) AS `comment_count`,(select count(0) from `likes` `l` where ((`l`.`target_type` = 'post') and (`l`.`target_id` = `p`.`post_id`))) AS `like_count` from (((`post` `p` join `users` `u` on((`p`.`user_id` = `u`.`user_id`))) left join `belonging_to` `bt` on((`p`.`post_id` = `bt`.`post_id`))) left join `section` `s` on((`bt`.`section_id` = `s`.`section_id`))) ;

-- ----------------------------
-- Procedure structure for `sp_block_user`
-- ----------------------------
DROP PROCEDURE IF EXISTS `sp_block_user`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_block_user`(
    IN p_blocker_id INT,
    IN p_blocked_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    -- 检查是否已关注
    IF EXISTS (SELECT 1 FROM FollowRelation WHERE follower_id = p_blocker_id AND followed_id = p_blocked_id) THEN
        SET p_success = FALSE;
        SET p_message = '请先取消关注再拉黑该用户';
    ELSEIF EXISTS (SELECT 1 FROM BlockRelation WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id) THEN
        SET p_success = FALSE;
        SET p_message = '已拉黑';
    ELSE
        INSERT INTO BlockRelation (blocker_id, blocked_id) VALUES (p_blocker_id, p_blocked_id);
        UPDATE Users SET blocker_count = blocker_count + 1 WHERE user_id = p_blocker_id;
        UPDATE Users SET blocked_count = blocked_count + 1 WHERE user_id = p_blocked_id;
        SET p_success = TRUE;
        SET p_message = '拉黑成功';
    END IF;
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for `sp_follow_user`
-- ----------------------------
DROP PROCEDURE IF EXISTS `sp_follow_user`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_follow_user`(
    IN p_follower_id INT,
    IN p_followed_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    -- 检查是否已拉黑
    IF EXISTS (SELECT 1 FROM BlockRelation WHERE blocker_id = p_follower_id AND blocked_id = p_followed_id) THEN
        SET p_success = FALSE;
        SET p_message = '请先取消拉黑再关注该用户';
    ELSEIF EXISTS (SELECT 1 FROM FollowRelation WHERE follower_id = p_follower_id AND followed_id = p_followed_id) THEN
        SET p_success = FALSE;
        SET p_message = '已关注';
    ELSE
        INSERT INTO FollowRelation (follower_id, followed_id) VALUES (p_follower_id, p_followed_id);
        UPDATE Users SET following_count = following_count + 1 WHERE user_id = p_follower_id;
        UPDATE Users SET follower_count = follower_count + 1 WHERE user_id = p_followed_id;
        SET p_success = TRUE;
        SET p_message = '关注成功';
    END IF;
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for `sp_save_profile_visibility`
-- ----------------------------
DROP PROCEDURE IF EXISTS `sp_save_profile_visibility`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_save_profile_visibility`(
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
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for `sp_toggle_like`
-- ----------------------------
DROP PROCEDURE IF EXISTS `sp_toggle_like`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_toggle_like`(
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
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for `sp_unblock_user`
-- ----------------------------
DROP PROCEDURE IF EXISTS `sp_unblock_user`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_unblock_user`(
    IN p_blocker_id INT,
    IN p_blocked_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM BlockRelation WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id) THEN
        SET p_success = FALSE;
        SET p_message = '未拉黑';
    ELSE
        DELETE FROM BlockRelation WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id;
        UPDATE Users SET blocker_count = GREATEST(0, blocker_count - 1) WHERE user_id = p_blocker_id;
        UPDATE Users SET blocked_count = GREATEST(0, blocked_count - 1) WHERE user_id = p_blocked_id;
        SET p_success = TRUE;
        SET p_message = '取消拉黑成功';
    END IF;
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for `sp_unfollow_user`
-- ----------------------------
DROP PROCEDURE IF EXISTS `sp_unfollow_user`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_unfollow_user`(
    IN p_follower_id INT,
    IN p_followed_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255)
)
BEGIN
    IF NOT EXISTS (SELECT 1 FROM FollowRelation WHERE follower_id = p_follower_id AND followed_id = p_followed_id) THEN
        SET p_success = FALSE;
        SET p_message = '未关注';
    ELSE
        DELETE FROM FollowRelation WHERE follower_id = p_follower_id AND followed_id = p_followed_id;
        UPDATE Users SET following_count = GREATEST(0, following_count - 1) WHERE user_id = p_follower_id;
        UPDATE Users SET follower_count = GREATEST(0, follower_count - 1) WHERE user_id = p_followed_id;
        SET p_success = TRUE;
        SET p_message = '取消关注成功';
    END IF;
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for `toggle_like`
-- ----------------------------
DROP PROCEDURE IF EXISTS `toggle_like`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `toggle_like`(
    IN p_user_id BIGINT,         -- The user performing the like/unlike action
    IN p_target_type ENUM('post','comment'), -- The type of item being liked
    IN p_target_id BIGINT        -- The ID of the item being liked
)
BEGIN
    DECLARE v_exists INT;
    DECLARE v_author_id BIGINT; -- Variable to store the author's user ID
    DECLARE v_author_current_exp BIGINT; -- Variable to store the author's current experience
    DECLARE v_author_current_level_id BIGINT; -- Variable to store the author's current level ID
    DECLARE v_new_level_id BIGINT; -- Variable to store the potential new level ID

    -- Check if already liked by the user performing the action (p_user_id)
    SELECT COUNT(*) INTO v_exists
    FROM likes
    WHERE user_id = p_user_id
    AND target_type = p_target_type
    AND target_id = p_target_id;

    IF v_exists > 0 THEN
        -- Unlike: Delete the like record
        DELETE FROM likes
        WHERE user_id = p_user_id
          AND target_type = p_target_type
          AND target_id = p_target_id;

        -- Find the author's user ID based on the target type (Same logic as in ELSE branch)
        IF p_target_type = 'post' THEN
            SELECT user_id INTO v_author_id FROM post WHERE post_id = p_target_id LIMIT 1;
        ELSEIF p_target_type = 'comment' THEN
            SELECT user_id INTO v_author_id FROM comment WHERE comment_id = p_target_id LIMIT 1;
        END IF;

        -- If the author's user ID is found and is not NULL
        IF v_author_id IS NOT NULL THEN
            -- Decrease the author's experience (ensure experience doesn't go below 0)
            UPDATE users SET experience = GREATEST(0, experience - 1) WHERE user_id = v_author_id;

            -- Get the author's current experience and level after update
            SELECT experience, level_id INTO v_author_current_exp, v_author_current_level_id FROM users WHERE user_id = v_author_id;

            -- Check if the author's level needs to be updated (potentially decreased)
            -- Find the highest level ID the author's current experience qualifies for
            SELECT MAX(level_id) INTO v_new_level_id
            FROM levelrule
            WHERE min_exp <= v_author_current_exp;

            -- If a new level ID is found, and it's different from the author's current level, update the author's level
            -- (This handles both level up and level down)
            IF v_new_level_id IS NOT NULL AND v_new_level_id <> v_author_current_level_id THEN
                UPDATE users SET level_id = v_new_level_id WHERE user_id = v_author_id;
            END IF;
        END IF;

    ELSE
        -- Add like: Insert the new like record
        INSERT INTO likes (user_id, target_type, target_id, create_at)
        VALUES (p_user_id, p_target_type, p_target_id, NOW());

        -- Find the author's user ID based on the target type
        IF p_target_type = 'post' THEN
            SELECT user_id INTO v_author_id FROM post WHERE post_id = p_target_id LIMIT 1;
        ELSEIF p_target_type = 'comment' THEN
            SELECT user_id INTO v_author_id FROM comment WHERE comment_id = p_target_id LIMIT 1;
        END IF;

        -- If the author's user ID is found and is not NULL
        IF v_author_id IS NOT NULL THEN
            -- Increase the author's experience (e.g., author gains 1 experience per like)
            UPDATE users SET experience = experience + 1 WHERE user_id = v_author_id;

            -- Get the author's current experience and level after update
            SELECT experience, level_id INTO v_author_current_exp, v_author_current_level_id FROM users WHERE user_id = v_author_id;

            -- Check if the author meets the requirement for a new level (only level up in this branch)
            -- Find the highest level ID the author's current experience qualifies for
            SELECT MAX(level_id) INTO v_new_level_id
            FROM levelrule
            WHERE min_exp <= v_author_current_exp;

            -- If a new level ID is found, and it's higher than the author's current level, update the author's level
            IF v_new_level_id IS NOT NULL AND v_new_level_id > v_author_current_level_id THEN
                UPDATE users SET level_id = v_new_level_id WHERE user_id = v_author_id;
            END IF;
        END IF;

    END IF;
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for `update_username`
-- ----------------------------
DROP PROCEDURE IF EXISTS `update_username`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `update_username`(
IN p_user_id INT,
IN p_new_username VARCHAR(255)
)
BEGIN
DECLARE user_exists INT;
DECLARE username_taken INT;

-- Check if the user exists
SELECT COUNT(*) INTO user_exists FROM Users WHERE user_id = p_user_id;

IF user_exists = 0 THEN
-- User does not exist, throw an error
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User does not exist';
ELSE
-- Check if the new username is already taken by another user
SELECT COUNT(*) INTO username_taken FROM Users WHERE username = p_new_username AND user_id <> p_user_id;

IF username_taken > 0 THEN
-- Username is already taken, throw an error
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username already exists';
ELSE
-- Username is available, perform the update
UPDATE Users
SET username = p_new_username
WHERE user_id = p_user_id;

-- Optionally return a success message or status
-- SELECT 'Username updated successfully' AS message;
END IF;
END IF;

END
;;
DELIMITER ;
DROP TRIGGER IF EXISTS `check_unique_user_info`;
DELIMITER ;;
CREATE TRIGGER `check_unique_user_info` BEFORE INSERT ON `users` FOR EACH ROW BEGIN
    -- Declare variables to store the count of users with the same username and student_id
    DECLARE username_count INT;
    DECLARE student_id_count INT;

    -- Check if username already exists
    SELECT COUNT(*)
    INTO username_count
    FROM users
    WHERE username = NEW.username;

    -- If a user with the same username is found (count > 0), signal an error and abort insertion
    IF username_count > 0 THEN
        SIGNAL SQLSTATE '45000' -- Generic SQLSTATE for unhandled user-defined exception
        SET MESSAGE_TEXT = 'Username already exists. Please choose another username!'; -- Set custom error message
    END IF;

    -- Check if student_id already exists (only check if the new student_id is not NULL)
    IF NEW.student_id IS NOT NULL THEN
        SELECT COUNT(*)
        INTO student_id_count
        FROM users
        WHERE student_id = NEW.student_id;

        -- If a user with the same student_id is found, signal an error and abort insertion
        IF student_id_count > 0 THEN
            SIGNAL SQLSTATE '45000' -- User-defined exception
            SET MESSAGE_TEXT = 'Student ID already exists. Cannot register again!';
        END IF;
    END IF;

END
;;
DELIMITER ;
