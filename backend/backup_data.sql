--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."User" VALUES (1, 'admin@example.com', '$2b$10$ncoD.UY3qLFoEP8sRCowteFLTnDM/vnacGlen9MgBCRT1mp/0AK.K', 'Administrator', '2025-04-12 23:50:09.18', '2025-04-12 23:52:12.435', '/avatars/defaults/avatar1.png', 'ADMIN', true, 'System Administrator', NULL, 'AdminUser');
INSERT INTO public."User" VALUES (2, 'user@example.com', '$2b$10$hnQYhe/m6h6jg/MMFGBtteP/OGK8bM3nKR3YiPtHAlu5xkWhnVFca', 'Regular User', '2025-04-12 23:50:09.386', '2025-04-12 23:52:12.613', '/avatars/defaults/avatar2.png', 'USER', false, 'Just a regular user.', NULL, 'NormalUser');
INSERT INTO public."User" VALUES (8, 'admin_backup@example.com', '$2b$10$S0LPWnkxrjnXFaCgFOH9BupdVJbAt8KZDWfctbfOXINfuElqUkULG', '备用管理员', '2025-04-12 23:56:02.256', '2025-04-12 23:56:02.256', NULL, 'admin', true, NULL, NULL, 'backup_admin');
INSERT INTO public."User" VALUES (7, '2223091291@qq.com', '$2b$10$Hsr19j5NN5659eWOhisSneqBhPv2RSWLajHjCzvqrSrP9k2R8Eoay', '小明', '2025-04-12 23:56:02.061', '2025-04-15 19:27:10.489', 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/preset-avatars/2.jpg?t=1744745222717', 'ADMIN', true, 'MVP MVP MVP !', NULL, 'main_admin');
INSERT INTO public."User" VALUES (10, '2223091293@qq.com', '$2b$10$pEdKtm3AyWAxF3wqaulyV.4GIXyooGOUBWskjK51lK0BVAh..tcm.', '王源', '2025-04-13 20:36:46.022', '2025-04-17 05:59:37.368', 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/preset-avatars/3.jpg?t=1744869558249', 'user', true, '芙蓉王源', NULL, 'testuser');
INSERT INTO public."User" VALUES (13, '2223091298@qq.com', '$2b$10$9B0MD7gb2wLX63CqzYVXT.RZDejUaPVziqPH3me74jkzTyP14R5C6', 'testuser1', '2025-04-22 06:36:41.225', '2025-04-22 06:36:41.225', NULL, 'user', false, NULL, NULL, 'testuser1');
INSERT INTO public."User" VALUES (14, '2223091299@qq.com', '$2b$10$xmrovCyFLqcoMyzxQ9oR9egHVDaPSpspF9NBjZhTeB94P9HAXCmSi', 'sssssssssssssssssssss', '2025-04-22 06:39:39.792', '2025-04-22 06:39:39.792', NULL, 'user', false, NULL, NULL, 'sssssssssssssssssssss');
INSERT INTO public."User" VALUES (15, '2223091210@qq.com', '$2b$10$rmj1GnNGW3rBEY7y7U1AleaWPLe5Vk8OEwzvCOU5G0AmAoadpOMzC', 'raga', '2025-04-29 11:41:21.645', '2025-04-29 11:45:17.433', 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/preset-avatars/5.jpg?t=1745926930514', 'user', true, '启动！', NULL, 'MIKELEE');
INSERT INTO public."User" VALUES (11, '2223091295@qq.com', '$2b$10$441Hg/OOv/kfPLpnttQMC.idrArg7SN6VZbFUAqS/RJRO54vz.pH2', 'leeeeeee', '2025-04-15 00:56:22.301', '2025-04-29 12:05:19.477', 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/user-avatars/user-11-1745928314431-174945647.png', 'user', true, NULL, NULL, 'leeeeeee');
INSERT INTO public."User" VALUES (9, '2223091292@qq.com', '$2b$10$8mmCyRjvidaNF0yoeLSExOXU1GaQkT.FGNy25p1Da1mfSeRxLr7oS', '丁真', '2025-04-13 17:25:58.043', '2025-04-15 16:34:04.196', 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/preset-avatars/4.jpg?t=1744659107597', 'user', true, '肺痒痒', NULL, 'Jason');


--
-- Data for Name: Post; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."Post" VALUES (2, 'xxx', 'xx', '2025-04-13 00:57:43.433', '2025-04-13 00:57:43.433', 7, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-7-1744505860677-680247425.png', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (4, 'cca', 'ccc', '2025-04-13 00:58:08.54', '2025-04-13 00:58:08.54', 7, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-7-1744505885920-364970132.png', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (7, '猫屎咖啡', '好喝', '2025-04-13 16:24:16.536', '2025-04-13 16:24:16.536', 7, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-7-1744561453985-248560843.jpg', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (8, '哎呀！今天去了法国餐厅！', '嘻嘻', '2025-04-13 16:24:53.872', '2025-04-13 16:24:53.872', 7, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-7-1744561491292-273991302.jpg', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (9, '我测你的🐎', '测试', '2025-04-13 17:31:46.616', '2025-04-13 17:31:46.616', 9, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-9-1744565504493-694303815.png', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (10, 'test', 'test', '2025-04-13 22:58:37.184', '2025-04-13 22:58:37.184', 10, NULL, false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (11, 'test ', 'test', '2025-04-13 22:59:04.284', '2025-04-13 22:59:04.284', 10, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-10-1744585140557-139742508.png', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (12, 'test', 'just a test', '2025-04-14 17:42:47.598', '2025-04-14 17:42:47.598', 10, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-10-1744652566156-867906293.png', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (13, 'ssss', 'hahaha', '2025-04-14 18:12:45.564', '2025-04-14 18:12:45.564', 7, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-7-1744654362343-552905356.png', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (14, '阳光青提！！！！', '妈妈的味道~', '2025-04-15 15:34:33.638', '2025-04-15 15:34:33.638', 7, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-7-1744731269469-639253788.jpg', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (15, '项目', '项目结构图项目结构图
项目结构图
项目结构图
项目结构图

项目结构图
项目结构图
', '2025-04-15 16:18:41.035', '2025-04-15 16:18:41.035', 7, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-7-1744733918496-925789822.jpg', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (16, '来一根', '我抽却不能抽的我抽却不能抽的我抽却不能抽的我抽却不能抽的', '2025-04-15 16:21:32.963', '2025-04-15 16:21:32.963', 9, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-9-1744734090818-187054679.jpg', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (18, '测测试测试', 'just  a  test ........', '2025-04-16 01:28:13.556', '2025-04-16 01:28:24.784', 7, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-7-1744766890359-751303287.png', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (19, 'Your projects', ' 配置VSCode以使用新的Python环境
在VSCode中，你可以通过以下步骤来选择Python解释器：
打开VSCode。
点击左下角的Python版本号，这会显示一个下拉菜单。
选择“Select Interpreter”。
选择你刚刚创建的虚拟环境中的Python解释器。这通常在.\venv\Scripts\python.exe。', '2025-04-29 11:51:07.522', '2025-04-29 11:51:07.522', 15, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-15-1745927464972-701838044.png', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (20, '水煮鱼', '水煮鱼（经典川菜版）做法​
​特点​：麻辣鲜香，鱼肉嫩滑，红油透亮

​食材准备​（2-3人份）
主料	辅料/调料
草鱼/黑鱼1条（约2斤）	豆芽200g、青菜（可选）
鱼骨/鱼头	干辣椒30g、花椒10g、郫县豆瓣酱2勺
鱼片（净肉）	蒜末20g、姜片10g、葱段20g
料酒2勺、淀粉1勺、蛋清1个（腌鱼用）
盐、糖、鸡精、白胡椒粉适量
​步骤详解​
1️⃣ ​处理鱼肉​
​去骨切片​：鱼去骨后斜刀切薄片（约3mm厚），鱼骨切段备用。
​腌鱼片​：鱼片+1勺料酒+1勺淀粉+1个蛋清+少许盐+白胡椒粉，抓匀腌15分钟。
2️⃣ ​炒底料​
热锅冷油，放鱼骨/鱼头煎至微黄，加姜片、葱段、1勺料酒翻炒，倒入开水煮10分钟成鱼汤，滤出汤备用。
另起锅烧油，放2勺郫县豆瓣酱小火炒出红油，加5-6片姜、10g蒜末炒香。
3️⃣ ​煮配菜​
鱼汤倒回锅中，加盐/糖/鸡精调味，先烫豆芽和青菜（1分钟），捞出铺碗底。
4️⃣ ​煮鱼片​
汤转小火，​一片片下鱼片（防粘连），煮至变白（约1分钟）连汤倒入碗中。
5️⃣ ​泼热油​
鱼片上撒干辣椒段、花椒、蒜末。
烧6成热油（180℃）浇上去，“滋啦”激香即可。
​关键技巧​
​鱼片不碎​：腌时加蛋清和淀粉，煮时用小火。
​麻辣控制​：减半干辣椒和花椒可做微辣版。
​升级版​：可加魔芋、宽粉等配菜。
上桌时配米饭，小心烫口！ 🌶️🍲', '2025-05-04 16:44:03.126', '2025-05-04 16:44:03.126', 9, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-9-1746377041350-938829443.jpg', false, 0, NULL, 'PUBLISHED');
INSERT INTO public."Post" VALUES (17, '1', '1', '2025-04-15 16:32:12.126', '2025-05-05 19:41:57.352', 9, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/post-images/post-9-1744734724803-483390707.jpg', false, 0, '2025-05-05 19:41:57.351', 'DELETED');


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."Comment" VALUES (4, '踩踩踩', '2025-04-13 16:25:05.699', '2025-04-13 16:25:05.699', 7, 8, NULL);
INSERT INTO public."Comment" VALUES (5, '嵌套测试', '2025-04-13 17:18:48.054', '2025-04-13 17:18:48.054', 7, 8, 4);
INSERT INTO public."Comment" VALUES (6, '嵌套测试', '2025-04-13 17:18:57.342', '2025-04-13 17:18:57.342', 7, 8, 5);
INSERT INTO public."Comment" VALUES (7, '嵌套测试', '2025-04-13 17:19:04.633', '2025-04-13 17:19:04.633', 7, 8, 6);
INSERT INTO public."Comment" VALUES (8, '评论测试', '2025-04-13 17:19:13.449', '2025-04-13 17:19:13.449', 7, 8, NULL);
INSERT INTO public."Comment" VALUES (9, '我测你的🐎', '2025-04-13 17:28:58.174', '2025-04-13 17:28:58.174', 9, 7, NULL);
INSERT INTO public."Comment" VALUES (10, '测试测试', '2025-04-13 17:29:04.737', '2025-04-13 17:29:04.737', 9, 7, NULL);
INSERT INTO public."Comment" VALUES (11, '我测你的🐎', '2025-04-13 17:29:16.223', '2025-04-13 17:29:16.223', 9, 7, 10);
INSERT INTO public."Comment" VALUES (12, '来一根', '2025-04-13 23:14:12.299', '2025-04-13 23:14:12.299', 10, 9, NULL);
INSERT INTO public."Comment" VALUES (13, '知识学爆', '2025-04-13 23:24:23.847', '2025-04-13 23:24:23.847', 10, 9, 12);
INSERT INTO public."Comment" VALUES (14, '111', '2025-04-14 18:29:23.113', '2025-04-14 18:29:23.113', 7, 9, 13);
INSERT INTO public."Comment" VALUES (15, 'cccc', '2025-04-14 18:32:02.019', '2025-04-14 18:32:02.019', 7, 7, NULL);
INSERT INTO public."Comment" VALUES (16, 'dasdasd', '2025-04-14 18:32:06.46', '2025-04-14 18:32:06.46', 7, 7, 9);
INSERT INTO public."Comment" VALUES (17, 'mvp', '2025-04-14 18:32:11.812', '2025-04-14 18:32:11.812', 7, 7, NULL);
INSERT INTO public."Comment" VALUES (18, 'testt', '2025-04-15 15:56:20.451', '2025-04-15 15:56:20.451', 7, 8, 8);
INSERT INTO public."Comment" VALUES (19, '111111', '2025-04-15 15:56:29.759', '2025-04-15 15:56:29.759', 7, 8, 18);
INSERT INTO public."Comment" VALUES (20, '的测试', '2025-04-15 16:18:55.613', '2025-04-15 16:18:55.613', 7, 15, NULL);
INSERT INTO public."Comment" VALUES (21, '1', '2025-04-24 08:28:22.683', '2025-04-24 08:28:22.683', 7, 18, NULL);
INSERT INTO public."Comment" VALUES (22, 'test', '2025-04-27 14:10:22.978', '2025-04-27 14:10:22.978', 7, 17, NULL);
INSERT INTO public."Comment" VALUES (23, '嵌套测试测试', '2025-04-27 14:11:11.667', '2025-04-27 14:11:11.667', 7, 17, 22);
INSERT INTO public."Comment" VALUES (24, '测试', '2025-04-28 11:27:39.295', '2025-04-28 11:27:39.295', 7, 18, NULL);
INSERT INTO public."Comment" VALUES (25, '我也想来', '2025-04-29 11:52:33.331', '2025-04-29 11:52:33.331', 15, 8, NULL);
INSERT INTO public."Comment" VALUES (26, '哪来的图', '2025-05-05 17:53:30.756', '2025-05-05 17:53:30.756', 7, 20, NULL);


--
-- Data for Name: EmailVerificationCode; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."EmailVerificationCode" VALUES (4, 'ca917298-5b12-4f5d-8f8f-8d222bafe1ec', 13, '2025-04-23 06:36:41.294', '2025-04-22 06:36:41.442');
INSERT INTO public."EmailVerificationCode" VALUES (5, '5f8ccd45-abac-4926-b2a3-d711c118bdb9', 14, '2025-04-23 06:39:39.859', '2025-04-22 06:39:39.928');


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."Favorite" VALUES (7, 4, '2025-04-13 01:02:13.027', 3);
INSERT INTO public."Favorite" VALUES (7, 2, '2025-04-13 01:02:14.355', 4);
INSERT INTO public."Favorite" VALUES (7, 8, '2025-04-13 16:25:12.561', 5);
INSERT INTO public."Favorite" VALUES (7, 7, '2025-04-13 16:25:13.393', 6);
INSERT INTO public."Favorite" VALUES (9, 8, '2025-04-13 17:28:42.868', 7);
INSERT INTO public."Favorite" VALUES (9, 7, '2025-04-13 17:28:44.775', 8);
INSERT INTO public."Favorite" VALUES (9, 4, '2025-04-13 17:31:10.438', 9);
INSERT INTO public."Favorite" VALUES (9, 2, '2025-04-13 17:31:15.802', 10);
INSERT INTO public."Favorite" VALUES (7, 9, '2025-04-14 18:29:16.801', 11);
INSERT INTO public."Favorite" VALUES (7, 13, '2025-04-14 19:20:53.362', 12);
INSERT INTO public."Favorite" VALUES (7, 15, '2025-04-15 16:18:50.834', 13);
INSERT INTO public."Favorite" VALUES (9, 17, '2025-04-15 16:32:28.246', 14);
INSERT INTO public."Favorite" VALUES (7, 17, '2025-04-17 05:58:45.502', 15);
INSERT INTO public."Favorite" VALUES (7, 18, '2025-04-17 05:58:47.504', 16);
INSERT INTO public."Favorite" VALUES (15, 15, '2025-04-29 11:42:26.672', 17);
INSERT INTO public."Favorite" VALUES (15, 17, '2025-04-29 11:42:27.534', 18);
INSERT INTO public."Favorite" VALUES (15, 16, '2025-04-29 11:42:28.373', 19);
INSERT INTO public."Favorite" VALUES (15, 19, '2025-04-29 11:53:02.315', 20);
INSERT INTO public."Favorite" VALUES (7, 19, '2025-05-04 16:21:22.257', 21);
INSERT INTO public."Favorite" VALUES (7, 20, '2025-05-05 17:53:19.181', 22);


--
-- Data for Name: Follows; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."Follows" VALUES (7, 10, '2025-04-14 18:34:52.447');
INSERT INTO public."Follows" VALUES (10, 7, '2025-04-14 19:30:43.638');
INSERT INTO public."Follows" VALUES (9, 7, '2025-05-04 16:46:11.299');
INSERT INTO public."Follows" VALUES (7, 9, '2025-05-05 18:23:30.018');


--
-- Data for Name: FoodShowcase; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."FoodShowcase" VALUES (1, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503559101-381958600.jpg', 'cafe_ambiance_3uXUiDjgH6U', NULL, '2025-04-13 00:19:22.31');
INSERT INTO public."FoodShowcase" VALUES (2, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503562557-138672907.jpg', 'cafe_ambiance_RHc7RXelY4w', NULL, '2025-04-13 00:19:26.444');
INSERT INTO public."FoodShowcase" VALUES (3, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503566605-710577365.jpg', 'chef_cooking_action_08bOYnH_r_E', NULL, '2025-04-13 00:19:28.805');
INSERT INTO public."FoodShowcase" VALUES (4, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503568965-601570850.jpg', 'healthy_breakfast_bowl_8manzosDSGM', NULL, '2025-04-13 00:19:32.509');
INSERT INTO public."FoodShowcase" VALUES (5, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503572671-749573298.jpg', 'healthy_breakfast_bowl_IGfIGP5ONV0', NULL, '2025-04-13 00:19:35.915');
INSERT INTO public."FoodShowcase" VALUES (6, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503576151-722346021.jpg', 'healthy_breakfast_bowl_mmsQUgMLqUo', NULL, '2025-04-13 00:19:39.21');
INSERT INTO public."FoodShowcase" VALUES (7, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503579371-991786239.jpg', 'steak_dinner_plating_fb0_wj2MZk4', NULL, '2025-04-13 00:19:41.763');
INSERT INTO public."FoodShowcase" VALUES (8, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503581922-972351043.jpg', 'steak_dinner_plating_t05q7TZObzc', NULL, '2025-04-13 00:19:44.259');
INSERT INTO public."FoodShowcase" VALUES (9, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503584419-673166950.jpg', 'steak_dinner_plating_TSS-1aqoRXE', NULL, '2025-04-13 00:19:46.26');
INSERT INTO public."FoodShowcase" VALUES (10, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503636324-254388581.jpg', 'cozy_restaurant_interior_uKdzZgTP398', NULL, '2025-04-13 00:20:39.218');
INSERT INTO public."FoodShowcase" VALUES (11, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503639379-757904432.jpg', 'fresh_artisan_bread_4J-LjXtrPRk', NULL, '2025-04-13 00:20:42.132');
INSERT INTO public."FoodShowcase" VALUES (12, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503642293-776367935.jpg', 'fresh_artisan_bread_96E3bL4tAuM', NULL, '2025-04-13 00:20:44.675');
INSERT INTO public."FoodShowcase" VALUES (13, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503644836-79486378.jpg', 'fresh_artisan_bread_Emhz3miT6mo', NULL, '2025-04-13 00:20:46.657');
INSERT INTO public."FoodShowcase" VALUES (14, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503646817-210661281.jpg', 'fresh_artisan_bread_FuYIwr3ALBI', NULL, '2025-04-13 00:20:49.227');
INSERT INTO public."FoodShowcase" VALUES (15, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503649388-741671993.jpg', 'fresh_artisan_bread_fXCHnthSQ_Q', NULL, '2025-04-13 00:20:52.056');
INSERT INTO public."FoodShowcase" VALUES (16, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503652292-613561759.jpg', 'fresh_ingredients_macro_2ppWUkmujgk', NULL, '2025-04-13 00:20:54.714');
INSERT INTO public."FoodShowcase" VALUES (17, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503654876-628838718.jpg', 'pasta_carbonara_plate_HrcpO5MCedQ', NULL, '2025-04-13 00:20:57.289');
INSERT INTO public."FoodShowcase" VALUES (18, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503657449-463268434.jpg', 'pasta_carbonara_plate_J7pMNY6VbnM', NULL, '2025-04-13 00:20:59.859');
INSERT INTO public."FoodShowcase" VALUES (19, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503660020-426902262.jpg', 'plated_dish_top_view_1keEJmqm8vU', NULL, '2025-04-13 00:21:03.391');
INSERT INTO public."FoodShowcase" VALUES (20, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503663551-329234280.jpg', 'plated_dish_top_view_e8CKnE2JBug', NULL, '2025-04-13 00:21:05.77');
INSERT INTO public."FoodShowcase" VALUES (21, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503665931-616349655.jpg', 'plated_dish_top_view_GhCPo2h6Ouk', NULL, '2025-04-13 00:21:07.938');
INSERT INTO public."FoodShowcase" VALUES (22, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503668173-371756266.jpg', 'ramen_noodle_bowl_C6Ijfa1uXLw', NULL, '2025-04-13 00:21:10.199');
INSERT INTO public."FoodShowcase" VALUES (23, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503670358-646783162.jpg', 'ramen_noodle_bowl_e0rzKWVUMu4', NULL, '2025-04-13 00:21:12.43');
INSERT INTO public."FoodShowcase" VALUES (24, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503672618-777858167.jpg', 'tempting_dessert_display_ZkgWJ4BfgsE', NULL, '2025-04-13 00:21:15.762');
INSERT INTO public."FoodShowcase" VALUES (25, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503675922-848502127.jpg', 'vibrant_fruit_salad_4p3fGgu9tgc', NULL, '2025-04-13 00:21:17.192');
INSERT INTO public."FoodShowcase" VALUES (29, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744658577200-556374016.jpg', 'gourmet_food_photography_sil2Hx4iupI', NULL, '2025-04-14 19:22:59.489');
INSERT INTO public."FoodShowcase" VALUES (33, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744658668809-440914511.jpg', '1', '222', '2025-04-14 19:24:31.076');
INSERT INTO public."FoodShowcase" VALUES (27, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503679316-13682505.jpg', 'vibrant_fruit_salad_j7X_hySaUa4', '', '2025-04-13 00:21:21.575');
INSERT INTO public."FoodShowcase" VALUES (28, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503681736-997551924.jpg', 'vibrant_fruit_salad_sf_1ZDA1YFw', '', '2025-04-13 00:21:22.516');
INSERT INTO public."FoodShowcase" VALUES (26, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744503677352-945297234.jpg', 'vibrant_fruit_salad_GdTLaWamFHw', '', '2025-04-13 00:21:19.155');
INSERT INTO public."FoodShowcase" VALUES (31, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744658582359-21842184.jpg', 'roasted_vegetables_dish_r0-vsmpJRbY', '', '2025-04-14 19:23:05.071');
INSERT INTO public."FoodShowcase" VALUES (32, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744658585237-543263376.jpg', 'roasted_vegetables_dish_Vu_fjfasu-4', '', '2025-04-14 19:23:08.571');
INSERT INTO public."FoodShowcase" VALUES (30, 'https://lmogvilniyadtkiapake.supabase.co/storage/v1/object/public/frsd-file/food-showcase/food-showcase-1744658579739-55246503.jpg', 'healthy_breakfast_bowl_5X8oLkzZ1fI', '', '2025-04-14 19:23:02.192');


--
-- Data for Name: FoodTag; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."FoodTag" VALUES (1, '中餐', true);
INSERT INTO public."FoodTag" VALUES (2, '西餐', true);
INSERT INTO public."FoodTag" VALUES (3, '日料', true);
INSERT INTO public."FoodTag" VALUES (4, '韩餐', true);
INSERT INTO public."FoodTag" VALUES (5, '甜品', true);
INSERT INTO public."FoodTag" VALUES (6, '饮品', true);
INSERT INTO public."FoodTag" VALUES (7, '小吃', true);
INSERT INTO public."FoodTag" VALUES (8, '素食', true);


--
-- Data for Name: FoodShowcaseTags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."FoodShowcaseTags" VALUES (26, 6);
INSERT INTO public."FoodShowcaseTags" VALUES (27, 8);
INSERT INTO public."FoodShowcaseTags" VALUES (33, 4);
INSERT INTO public."FoodShowcaseTags" VALUES (28, 4);
INSERT INTO public."FoodShowcaseTags" VALUES (31, 4);
INSERT INTO public."FoodShowcaseTags" VALUES (31, 2);
INSERT INTO public."FoodShowcaseTags" VALUES (32, 6);
INSERT INTO public."FoodShowcaseTags" VALUES (32, 3);
INSERT INTO public."FoodShowcaseTags" VALUES (30, 4);
INSERT INTO public."FoodShowcaseTags" VALUES (30, 5);
INSERT INTO public."FoodShowcaseTags" VALUES (30, 3);
INSERT INTO public."FoodShowcaseTags" VALUES (30, 7);
INSERT INTO public."FoodShowcaseTags" VALUES (30, 1);


--
-- Data for Name: Like; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."Like" VALUES (7, 4, '2025-04-13 01:02:08.178', 2);
INSERT INTO public."Like" VALUES (7, 8, '2025-04-13 16:24:56.317', 3);
INSERT INTO public."Like" VALUES (9, 8, '2025-04-13 17:28:42.083', 4);
INSERT INTO public."Like" VALUES (9, 7, '2025-04-13 17:28:43.781', 5);
INSERT INTO public."Like" VALUES (10, 10, '2025-04-13 22:58:42.781', 6);
INSERT INTO public."Like" VALUES (10, 11, '2025-04-14 16:24:26.314', 7);
INSERT INTO public."Like" VALUES (7, 9, '2025-04-14 18:29:15.659', 8);
INSERT INTO public."Like" VALUES (7, 13, '2025-04-14 19:20:50.169', 9);
INSERT INTO public."Like" VALUES (10, 12, '2025-04-14 19:31:27.587', 10);
INSERT INTO public."Like" VALUES (10, 13, '2025-04-14 19:31:29.838', 11);
INSERT INTO public."Like" VALUES (10, 9, '2025-04-14 19:31:31.384', 12);
INSERT INTO public."Like" VALUES (10, 2, '2025-04-14 19:31:32.641', 13);
INSERT INTO public."Like" VALUES (10, 4, '2025-04-14 19:31:33.661', 14);
INSERT INTO public."Like" VALUES (10, 8, '2025-04-14 19:31:35.15', 15);
INSERT INTO public."Like" VALUES (7, 12, '2025-04-15 15:32:42.599', 16);
INSERT INTO public."Like" VALUES (7, 14, '2025-04-15 15:34:44.396', 17);
INSERT INTO public."Like" VALUES (7, 15, '2025-04-15 16:18:49.243', 18);
INSERT INTO public."Like" VALUES (9, 16, '2025-04-15 16:21:38.342', 19);
INSERT INTO public."Like" VALUES (9, 14, '2025-04-15 16:51:22.519', 20);
INSERT INTO public."Like" VALUES (9, 10, '2025-04-15 16:51:23.534', 21);
INSERT INTO public."Like" VALUES (9, 11, '2025-04-15 16:51:24.386', 22);
INSERT INTO public."Like" VALUES (10, 16, '2025-04-22 06:32:58.035', 25);
INSERT INTO public."Like" VALUES (7, 17, '2025-04-24 08:28:16.895', 26);
INSERT INTO public."Like" VALUES (7, 16, '2025-04-24 08:28:18.518', 27);
INSERT INTO public."Like" VALUES (7, 18, '2025-04-27 14:10:11.896', 28);
INSERT INTO public."Like" VALUES (15, 18, '2025-04-29 11:42:23.806', 29);
INSERT INTO public."Like" VALUES (15, 17, '2025-04-29 11:42:24.679', 30);
INSERT INTO public."Like" VALUES (15, 15, '2025-04-29 11:42:25.712', 31);
INSERT INTO public."Like" VALUES (15, 19, '2025-04-29 11:53:01.672', 32);
INSERT INTO public."Like" VALUES (7, 19, '2025-05-04 16:21:20.826', 33);
INSERT INTO public."Like" VALUES (9, 20, '2025-05-04 16:44:42.918', 34);
INSERT INTO public."Like" VALUES (7, 20, '2025-05-05 17:53:18.094', 35);


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."Notification" VALUES (1, 7, 8, NULL, '2025-04-13 17:28:42.427', false, NULL, 9, 'LIKE');
INSERT INTO public."Notification" VALUES (2, 7, 8, NULL, '2025-04-13 17:28:43.247', false, NULL, 9, 'FAVORITE');
INSERT INTO public."Notification" VALUES (3, 7, 7, NULL, '2025-04-13 17:28:43.984', false, NULL, 9, 'LIKE');
INSERT INTO public."Notification" VALUES (4, 7, 7, NULL, '2025-04-13 17:28:45.049', false, NULL, 9, 'FAVORITE');
INSERT INTO public."Notification" VALUES (5, 7, 7, 9, '2025-04-13 17:28:58.581', false, NULL, 9, 'COMMENT');
INSERT INTO public."Notification" VALUES (6, 7, 7, 10, '2025-04-13 17:29:05.007', false, NULL, 9, 'COMMENT');
INSERT INTO public."Notification" VALUES (7, 7, 7, 11, '2025-04-13 17:29:16.56', false, NULL, 9, 'REPLY');
INSERT INTO public."Notification" VALUES (8, 7, 4, NULL, '2025-04-13 17:31:10.834', false, NULL, 9, 'FAVORITE');
INSERT INTO public."Notification" VALUES (9, 7, 2, NULL, '2025-04-13 17:31:16.04', false, NULL, 9, 'FAVORITE');
INSERT INTO public."Notification" VALUES (10, 9, 9, 12, '2025-04-13 23:14:12.759', false, NULL, 10, 'COMMENT');
INSERT INTO public."Notification" VALUES (11, 9, 9, 13, '2025-04-13 23:24:24.288', false, NULL, 10, 'REPLY');
INSERT INTO public."Notification" VALUES (12, 9, 9, NULL, '2025-04-14 18:29:16.054', false, NULL, 7, 'LIKE');
INSERT INTO public."Notification" VALUES (14, 9, 9, 14, '2025-04-14 18:29:23.596', false, NULL, 7, 'REPLY');
INSERT INTO public."Notification" VALUES (15, 7, 13, NULL, '2025-04-14 19:31:30.051', false, NULL, 10, 'LIKE');
INSERT INTO public."Notification" VALUES (16, 9, 9, NULL, '2025-04-14 19:31:31.584', false, NULL, 10, 'LIKE');
INSERT INTO public."Notification" VALUES (17, 7, 2, NULL, '2025-04-14 19:31:32.84', false, NULL, 10, 'LIKE');
INSERT INTO public."Notification" VALUES (18, 7, 4, NULL, '2025-04-14 19:31:33.867', false, NULL, 10, 'LIKE');
INSERT INTO public."Notification" VALUES (20, 10, 12, NULL, '2025-04-15 15:32:42.969', false, NULL, 7, 'LIKE');
INSERT INTO public."Notification" VALUES (19, 7, 8, NULL, '2025-04-14 19:31:35.379', true, NULL, 10, 'LIKE');
INSERT INTO public."Notification" VALUES (13, 9, 9, NULL, '2025-04-14 18:29:17.226', true, NULL, 7, 'FAVORITE');
INSERT INTO public."Notification" VALUES (22, 10, 10, NULL, '2025-04-15 16:51:23.736', false, NULL, 9, 'LIKE');
INSERT INTO public."Notification" VALUES (23, 10, 11, NULL, '2025-04-15 16:51:24.587', false, NULL, 9, 'LIKE');
INSERT INTO public."Notification" VALUES (24, 9, 17, NULL, '2025-04-17 05:58:45.026', false, NULL, 7, 'LIKE');
INSERT INTO public."Notification" VALUES (25, 9, 17, NULL, '2025-04-17 05:58:45.763', false, NULL, 7, 'FAVORITE');
INSERT INTO public."Notification" VALUES (26, 9, 16, NULL, '2025-04-22 06:32:58.409', false, NULL, 10, 'LIKE');
INSERT INTO public."Notification" VALUES (21, 7, 14, NULL, '2025-04-15 16:51:22.86', true, NULL, 9, 'LIKE');
INSERT INTO public."Notification" VALUES (27, 9, 17, NULL, '2025-04-24 08:28:17.288', false, NULL, 7, 'LIKE');
INSERT INTO public."Notification" VALUES (28, 9, 16, NULL, '2025-04-24 08:28:18.733', false, NULL, 7, 'LIKE');
INSERT INTO public."Notification" VALUES (29, 9, 17, 22, '2025-04-27 14:10:23.646', false, NULL, 7, 'COMMENT');
INSERT INTO public."Notification" VALUES (30, 9, 17, 23, '2025-04-27 14:11:11.982', false, NULL, 7, 'REPLY');
INSERT INTO public."Notification" VALUES (31, 7, 18, NULL, '2025-04-29 11:42:24.208', false, NULL, 15, 'LIKE');
INSERT INTO public."Notification" VALUES (32, 9, 17, NULL, '2025-04-29 11:42:25.066', false, NULL, 15, 'LIKE');
INSERT INTO public."Notification" VALUES (33, 7, 15, NULL, '2025-04-29 11:42:25.944', false, NULL, 15, 'LIKE');
INSERT INTO public."Notification" VALUES (34, 7, 15, NULL, '2025-04-29 11:42:26.987', false, NULL, 15, 'FAVORITE');
INSERT INTO public."Notification" VALUES (35, 9, 17, NULL, '2025-04-29 11:42:27.768', false, NULL, 15, 'FAVORITE');
INSERT INTO public."Notification" VALUES (36, 9, 16, NULL, '2025-04-29 11:42:28.611', false, NULL, 15, 'FAVORITE');
INSERT INTO public."Notification" VALUES (37, 7, 8, 25, '2025-04-29 11:52:33.853', false, NULL, 15, 'COMMENT');
INSERT INTO public."Notification" VALUES (38, 15, 19, NULL, '2025-05-04 16:21:21.504', false, NULL, 7, 'LIKE');
INSERT INTO public."Notification" VALUES (39, 15, 19, NULL, '2025-05-04 16:21:22.628', false, NULL, 7, 'FAVORITE');
INSERT INTO public."Notification" VALUES (40, 9, 20, NULL, '2025-05-05 17:53:18.455', false, NULL, 7, 'LIKE');
INSERT INTO public."Notification" VALUES (41, 9, 20, NULL, '2025-05-05 17:53:19.452', false, NULL, 7, 'FAVORITE');
INSERT INTO public."Notification" VALUES (42, 9, 20, 26, '2025-05-05 17:53:31.162', false, NULL, 7, 'COMMENT');


--
-- Data for Name: PasswordResetCode; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: PostTag; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."PostTag" VALUES (1, '美食分享', true);
INSERT INTO public."PostTag" VALUES (2, '烹饪技巧', true);
INSERT INTO public."PostTag" VALUES (3, '餐厅推荐', true);
INSERT INTO public."PostTag" VALUES (4, '家常菜', true);
INSERT INTO public."PostTag" VALUES (5, '甜点', true);
INSERT INTO public."PostTag" VALUES (6, '健康饮食', true);


--
-- Data for Name: _Collections; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: _CommentLikes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: _PostLikes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: _PostTags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."_PostTags" VALUES (16, 8);
INSERT INTO public."_PostTags" VALUES (18, 7);
INSERT INTO public."_PostTags" VALUES (20, 2);


--
-- Data for Name: _ShowcaseToTag; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public._prisma_migrations VALUES ('0950c5c1-4d08-443b-a13b-8e79d8b21273', 'c2ab6b973fa17b00a90d7c656ecd6304f7a772f1b3c5300176cdf43129647708', '2025-05-05 20:46:48.320892+00', '20250506044530_add_setting_model', '', NULL, '2025-05-05 20:46:48.320892+00', 0);


--
-- Name: Comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Comment_id_seq"', 26, true);


--
-- Name: EmailVerificationCode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."EmailVerificationCode_id_seq"', 7, true);


--
-- Name: Favorite_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Favorite_id_seq"', 22, true);


--
-- Name: FoodShowcase_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."FoodShowcase_id_seq"', 33, true);


--
-- Name: FoodTag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."FoodTag_id_seq"', 9, true);


--
-- Name: Like_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Like_id_seq"', 35, true);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 42, true);


--
-- Name: PasswordResetCode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."PasswordResetCode_id_seq"', 3, true);


--
-- Name: PostTag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."PostTag_id_seq"', 8, true);


--
-- Name: Post_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."Post_id_seq"', 22, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public."User_id_seq"', 15, true);


--
-- PostgreSQL database dump complete
--

