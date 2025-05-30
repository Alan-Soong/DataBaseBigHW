/*
Navicat MySQL Data Transfer

Source Server         : DataBaseHomeWork
Source Server Version : 80019
Source Host           : localhost:3306
Source Database       : mybbs

Target Server Type    : MYSQL
Target Server Version : 80019
File Encoding         : 65001

Date: 2025-05-30 20:49:52
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for `belonging_to`
-- ----------------------------
DROP TABLE IF EXISTS `belonging_to`;
CREATE TABLE `belonging_to` (
  `section_id` bigint NOT NULL,
  `post_id` bigint NOT NULL,
  PRIMARY KEY (`section_id`,`post_id`),
  KEY `fk_belong_post` (`post_id`),
  CONSTRAINT `fk_belong_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`),
  CONSTRAINT `fk_belong_section` FOREIGN KEY (`section_id`) REFERENCES `section` (`section_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of belonging_to
-- ----------------------------
INSERT INTO `belonging_to` VALUES ('1', '4');
INSERT INTO `belonging_to` VALUES ('2', '12');
INSERT INTO `belonging_to` VALUES ('1', '13');
INSERT INTO `belonging_to` VALUES ('5', '14');

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
  `parent_comment_id` bigint NULL,
  PRIMARY KEY (`comment_id`),
  KEY `fk_comment_user` (`user_id`),
  KEY `fk_comment_post` (`post_id`),
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`post_id`),
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_comment_id`) REFERENCES `comment` (`comment_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of comment
-- ----------------------------
INSERT INTO `comment` VALUES ('1', '4', '2', '该我了！', '2025-05-27 22:53:30', null);
INSERT INTO `comment` VALUES ('3', '4', '4', '111', '2025-05-28 10:45:12', null);
INSERT INTO `comment` VALUES ('6', '2', '13', '支持密码事业蓬勃发展！', '2025-05-30 01:40:25', null);
INSERT INTO `comment` VALUES ('7', '4', '13', '你是谁？', '2025-05-30 01:43:09', null);
INSERT INTO `comment` VALUES ('9', '4', '12', '蒸蒸日上！', '2025-05-30 20:29:23', null);
INSERT INTO `comment` VALUES ('10', '5', '2', '支持管理员！', '2025-05-30 20:41:02', null);

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
  KEY `fk_like_user` (`user_id`),
  CONSTRAINT `fk_like_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of likes
-- ----------------------------
INSERT INTO `likes` VALUES ('15', '3', 'post', '4', '2025-05-28 10:46:04');
INSERT INTO `likes` VALUES ('17', '3', 'post', '2', '2025-05-28 10:49:33');
INSERT INTO `likes` VALUES ('29', '5', 'post', '4', '2025-05-29 16:54:10');
INSERT INTO `likes` VALUES ('34', '5', 'post', '13', '2025-05-29 19:01:54');
INSERT INTO `likes` VALUES ('47', '4', 'comment', '6', '2025-05-30 09:27:14');
INSERT INTO `likes` VALUES ('48', '4', 'post', '13', '2025-05-30 09:27:17');
INSERT INTO `likes` VALUES ('50', '4', 'post', '4', '2025-05-30 09:32:03');
INSERT INTO `likes` VALUES ('51', '4', 'post', '14', '2025-05-30 09:33:52');
INSERT INTO `likes` VALUES ('52', '4', 'post', '2', '2025-05-30 17:55:21');
INSERT INTO `likes` VALUES ('53', '4', 'comment', '1', '2025-05-30 17:55:25');
INSERT INTO `likes` VALUES ('55', '5', 'post', '2', '2025-05-30 20:40:50');

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
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of post
-- ----------------------------
INSERT INTO `post` VALUES ('2', '2', '技术分享', '分享我的Next.js学习心得', '2025-05-19 11:00:00', '2025-05-19 11:00:00');
INSERT INTO `post` VALUES ('4', '4', 'qwe', 'sda', '2025-05-27 22:50:47', '2025-05-27 22:50:47');
INSERT INTO `post` VALUES ('12', '5', '计科', '南开大学计算机学院', '2025-05-29 16:15:31', '2025-05-29 16:15:31');
INSERT INTO `post` VALUES ('13', '5', '123', '南开大学密码与网络空间安全学院', '2025-05-29 17:04:43', '2025-05-29 17:04:43');
INSERT INTO `post` VALUES ('14', '4', '出书！', '有朋友想买书吗？价格便宜，后台私信我！', '2025-05-30 09:23:34', '2025-05-30 09:23:34');

-- ----------------------------
-- Table structure for `profilevisibility`
-- ----------------------------
DROP TABLE IF EXISTS `profilevisibility`;
CREATE TABLE `profilevisibility` (
  `field_name` varchar(255) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `visible_to_admin_only` tinyint(1) DEFAULT NULL,
  `visible_to_followers_only` tinyint(1) DEFAULT NULL,
  `visible_to_all` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`field_name`),
  KEY `fk_visibility_user` (`user_id`),
  CONSTRAINT `fk_visibility_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of profilevisibility
-- ----------------------------
INSERT INTO `profilevisibility` VALUES ('recent_posts', '4', '0', '0', '1');

-- ----------------------------
-- Table structure for `section`
-- ----------------------------
DROP TABLE IF EXISTS `section`;
CREATE TABLE `section` (
  `section_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `section_name` varchar(255) DEFAULT NULL,
  `description` text,
  PRIMARY KEY (`section_id`),
  KEY `fk_section_creator` (`user_id`),
  CONSTRAINT `fk_section_creator` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of section
-- ----------------------------
INSERT INTO `section` VALUES ('1', null, '校园生活', '分享校园日常生活、活动和趣事');
INSERT INTO `section` VALUES ('2', null, '学术交流', '讨论学术问题、分享学习资源和经验');
INSERT INTO `section` VALUES ('3', null, '社团活动', '发布社团活动信息、招新和活动回顾');
INSERT INTO `section` VALUES ('4', null, '失物招领', '发布校园内丢失和拾获物品的信息');
INSERT INTO `section` VALUES ('5', null, '二手交易', '发布二手物品交易信息');

-- ----------------------------
-- Table structure for `useridentity`
-- ----------------------------
DROP TABLE IF EXISTS `useridentity`;
CREATE TABLE `useridentity` (
  `identity_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `student_id` bigint DEFAULT NULL,
  PRIMARY KEY (`identity_id`),
  KEY `fk_identity_user` (`user_id`),
  CONSTRAINT `fk_identity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of useridentity
-- ----------------------------

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('2', null, '1', null, 'fdsa', null, '8909-0-9', '0', '1', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('3', null, '1', '2131421', 'ALM', 'Computer Science', 'qpalz,da', '0', '1', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('4', null, '1', '134452', 'Pity', 'Finance', '10erosf', '3', '1', '0', '0', '0', '0');
INSERT INTO `users` VALUES ('5', null, '1', '2311100', '2311100', '物联网', '123456', '2', '1', '0', '0', '0', '0');
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

SET FOREIGN_KEY_CHECKS=1;
