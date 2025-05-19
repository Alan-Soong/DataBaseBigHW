
/* Optimized BBS Database Schema */

drop table if exists Belonging_to;
drop table if exists BlockRelation;
drop table if exists BlockVisibility;
drop table if exists Comment;
drop table if exists FollowRelation;
drop table if exists FollowVisibility;
drop table if exists LevelRule;
drop table if exists Likes;
drop table if exists Post;
drop table if exists ProfileVisibility;
drop table if exists Section;
drop table if exists Users;
drop table if exists UserIdentity;
drop table if exists UserIsAdmin;

/* Table: LevelRule */
create table LevelRule (
    level_id bigint not null primary key,
    level_name varchar(255),
    min_exp bigint
);

/* Table: Users */
create table Users (
    user_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY
    user_id bigint not null primary key,
    identity_id bigint,
    level_id bigint not null,
    student_id bigint,
    username varchar(255),
    major varchar(255),
    password varchar(255),
    experience bigint,
    level int,
    constraint fk_user_level foreign key (level_id) references LevelRule(level_id)
);

/* Table: UserIdentity */
create table UserIdentity (
    identity_id bigint not null primary key,
    user_id bigint not null,
    student_id bigint,
    constraint fk_identity_user foreign key (user_id) references Users(user_id)
);

/* Table: UserIsAdmin */
create table UserIsAdmin (
    user_id bigint not null primary key,
    is_admin bool not null,
    constraint fk_admin_user foreign key (user_id) references Users(user_id)
);

/* Table: ProfileVisibility */
create table ProfileVisibility (
    field_name varchar(255) not null primary key,
    user_id bigint,
    visible_to_admin_only bool,
    constraint fk_visibility_user foreign key (user_id) references Users(user_id)
);

/* Table: Section */
create table Section (
    section_id bigint not null primary key,
    user_id bigint,
    section_name varchar(255),
    description text,
    constraint fk_section_creator foreign key (user_id) references Users(user_id)
);

/* Table: Post */
create table Post (
    post_id bigint not null primary key,
    user_id bigint not null,
    title varchar(255),
    content text,
    create_at datetime,
    post_time datetime,
    constraint fk_post_user foreign key (user_id) references Users(user_id)
);

/* Table: Comment */
create table Comment (
    comment_id bigint not null primary key,
    user_id bigint not null,
    post_id bigint not null,
    content text,
    create_at datetime,
    constraint fk_comment_user foreign key (user_id) references Users(user_id),
    constraint fk_comment_post foreign key (post_id) references Post(post_id)
);

/* Table: Likes */
create table Likes (
    like_id bigint not null primary key,
    user_id bigint not null,
    target_type enum('post', 'comment'),
    target_id bigint,
    create_at datetime,
    constraint fk_like_user foreign key (user_id) references Users(user_id)
);

/* Table: Belonging_to */
create table Belonging_to (
    section_id bigint not null,
    post_id bigint not null,
    primary key (section_id, post_id),
    constraint fk_belong_section foreign key (section_id) references Section(section_id),
    constraint fk_belong_post foreign key (post_id) references Post(post_id)
);

/* Table: BlockRelation */
create table BlockRelation (
    blocker_id bigint not null,
    blocked_id bigint not null,
    block_time datetime,
    primary key (blocker_id, blocked_id)
);

/* Table: BlockVisibility */
create table BlockVisibility (
    blocker_id bigint not null,
    blocked_id bigint not null,
    field_name varchar(255) not null,
    primary key (blocker_id, blocked_id, field_name),
    constraint fk_block_rel foreign key (blocker_id, blocked_id) references BlockRelation(blocker_id, blocked_id),
    constraint fk_block_field foreign key (field_name) references ProfileVisibility(field_name)
);

/* Table: FollowRelation */
create table FollowRelation (
    follower_id bigint not null,
    followed_id bigint not null,
    follow_time datetime,
    primary key (follower_id, followed_id)
);

/* Table: FollowVisibility */
create table FollowVisibility (
    follower_id bigint not null,
    followed_id bigint not null,
    field_name varchar(255) not null,
    primary key (follower_id, followed_id, field_name),
    constraint fk_follow_rel foreign key (follower_id, followed_id) references FollowRelation(follower_id, followed_id),
    constraint fk_follow_field foreign key (field_name) references ProfileVisibility(field_name)
);
