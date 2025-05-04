# 使用 Graphviz (DOT 语言) 生成系统全局 E-R 图

## 推荐工具

推荐使用 **Graphviz (DOT 语言)** 来绘制符合传统风格（矩形实体、菱形关系、基数标注）的系统全局 E-R 图。

**优点:**
*   直接支持矩形 (box) 和菱形 (diamond) 形状。
*   布局控制相对灵活。
*   纯文本描述，便于维护和版本控制。

## DOT 语言基本结构 ( 代码模板)
digraph 系统全局ER图 {
    // --- 全局设置 ---
    graph [rankdir=TB, nodesep=0.8, ranksep=1.2, fontname="SimSun", 
           label="系统全局 E-R 图", labelloc=t, fontsize=14, 
           compound=true, newrank=true];
    node [fontname="SimSun", fontsize=12];
    edge [fontname="SimSun", fontsize=12, labelfontsize=12];

    // --- 核心实体分层 ---
    // 第一层：用户
    node [shape=box, style=filled, fillcolor=white];
    User [label="用户", pos="0,4!"];

    // 第二层：主要关系
    node [shape=diamond, width=0.8, height=0.8];
    r_publish [label="发布", pos="0,3!"];
    r_follow [label="关注", pos="-2,3!"];
    r_notify [label="通知用户", pos="2,3!"];

    // 第三层：核心实体
    Post [label="帖子", pos="0,2!"];
    Notification [label="通知", pos="2,2!"];

    // 第四层：次级关系
    r_tag_post [label="标记帖子", pos="0,1!"];
    r_like_post [label="点赞帖子", pos="-1,1!"];
    r_collect_post [label="收藏帖子", pos="1,1!"];
    r_contain_comment [label="包含", pos="0,0!"];
    r_write_comment [label="发表", pos="-2,0!"];

    // 第五层：末端实体
    PostTag [label="标签", pos="0,-1!"];
    Comment [label="评论", pos="0,-2!"];
    r_reply [label="回复", pos="0,-3!"];

    // --- 右侧分支 ---
    FoodShowcase [label="美食展示", pos="3,2!"];
    r_tag_food [label="标记食物", pos="3,1!"];
    FoodTag [label="食物标签", pos="3,0!"];

    // --- 左侧分支 ---
    EmailVerificationCode [label="邮箱验证码", pos="-3,2!"];
    r_has_email_code [label="拥有", pos="-3,1!"];
    PasswordResetCode [label="密码重置码", pos="-3,0!"];
    r_has_reset_code [label="拥有", pos="-3,-1!"];

    // --- 明确定位的关系 ---
    r_like_comment [label="点赞评论", pos="-2,-2!"];

    // --- 主要连接关系 ---
    // 用户核心关系
    User -> r_publish [xlabel="1", dir=none];
    r_publish -> Post [xlabel="n", dir=none];
    
    User -> r_follow [xlabel="m", dir=none];
    r_follow -> User [xlabel="n", dir=none];
    
    User -> r_notify [xlabel="1", dir=none];
    r_notify -> Notification [xlabel="n", dir=none];

    // 帖子相关
    Post -> r_tag_post [xlabel="m", dir=none];
    r_tag_post -> PostTag [xlabel="n", dir=none];
    
    User -> r_like_post [xlabel="m", dir=none];
    r_like_post -> Post [xlabel="n", dir=none];
    
    User -> r_collect_post [xlabel="m", dir=none];
    r_collect_post -> Post [xlabel="n", dir=none];

    // 评论相关
    Post -> r_contain_comment [xlabel="1", dir=none];
    r_contain_comment -> Comment [xlabel="n", dir=none];
    
    User -> r_write_comment [xlabel="1", dir=none];
    r_write_comment -> Comment [xlabel="n", dir=none];
    
    User -> r_like_comment [xlabel="m", dir=none];
    r_like_comment -> Comment [xlabel="n", dir=none];
    
    Comment -> r_reply [xlabel="1", dir=none];
    r_reply -> Comment [xlabel="n", dir=none];

    // 美食相关
    FoodShowcase -> r_tag_food [xlabel="m", dir=none];
    r_tag_food -> FoodTag [xlabel="n", dir=none];

    // 验证相关
    User -> r_has_email_code [xlabel="1", dir=none];
    r_has_email_code -> EmailVerificationCode [xlabel="n", dir=none];
    
    User -> r_has_reset_code [xlabel="1", dir=none];
    r_has_reset_code -> PasswordResetCode [xlabel="n", dir=none];

    // --- 布局分组 ---
    { rank=same; r_publish; r_follow; r_notify }
    { rank=same; Post; Notification; FoodShowcase; EmailVerificationCode }
    { rank=same; r_tag_post; r_like_post; r_collect_post; r_tag_food }
    { rank=same; r_contain_comment; r_write_comment }
    { rank=same; PostTag; Comment; FoodTag; PasswordResetCode }
    { rank=same; r_reply; r_like_comment }
}







## 图一
digraph CoreEntities {
    graph [rankdir=TB, nodesep=0.6, ranksep=1.0, fontname="SimSun", label="图 1: 核心实体关系 (用户-帖子)", labelloc=t, fontsize=14];
    node [fontname="SimSun", fontsize=11, shape=box, style=filled, fillcolor=white, color=black, height=0.4, width=1.0];
    edge [fontname="SimSun", fontsize=9, labelfontsize=9];

    // Entities
    User [label="用户"];
    Post [label="帖子"];

    // Relationship
    node [shape=diamond, margin=0.1, width=0.8, height=0.8, style=filled, fillcolor=white, color=black];
    r_publish [label="发布"];

    // Connections
    User -> r_publish [xlabel=" 1", dir=none];
    r_publish -> Post [xlabel="n ", dir=none];
}
## 图二
digraph OneToManyRelationships_v2 {
    // --- 全局设置 ---
    graph [rankdir=TB, nodesep=0.7, ranksep=1.2, fontname="SimSun", 
           label="图 2: 一对多关系 (基于描述第2点)", labelloc=t, fontsize=14];
    node [fontname="SimSun", fontsize=11];
    edge [fontname="SimSun", fontsize=9, labelfontsize=9];

    // --- 实体定义 ---
    node [shape=box, style=filled, fillcolor=white, color=black, height=0.4, width=1.0];
    User [label="用户"];
    Post [label="帖子"];
    Comment [label="评论"];
    Like [label="点赞记录"];
    Favorite [label="收藏记录"];
    Notification [label="通知"];
    EmailVerificationCode [label="邮箱验证码"];
    PasswordResetCode [label="密码重置码"];

    // --- 关系定义 ---
    node [shape=diamond, margin=0.1, width=0.8, height=0.8, style=filled, fillcolor=white, color=black];
    r_publish [label="发布"];
    r_write_comment [label="发表"];
    r_contain_comment [label="包含"];
    r_give_like [label="发出"];
    r_receive_like [label="收到"];
    r_make_favorite [label="收藏"];
    r_is_favorite [label="被收藏"];
    r_notify [label="通知"];
    r_has_email_code [label="拥有"];
    r_has_reset_code [label="拥有"];
    r_reply [label="回复"];

    // --- 核心1:N关系 ---
    // (1) User -> Post
    User -> r_publish [xlabel=" 1", dir=none];
    r_publish -> Post [xlabel="n ", dir=none];

    // (2) User -> Comment
    User -> r_write_comment [xlabel=" 1", dir=none];
    r_write_comment -> Comment [xlabel="n ", dir=none];

    // (3) Post -> Comment
    Post -> r_contain_comment [xlabel=" 1", dir=none];
    r_contain_comment -> Comment [xlabel="n ", dir=none];

    // --- Like/Favorite关系 ---
    // (4) User -> Like
    User -> r_give_like [xlabel=" 1", dir=none];
    r_give_like -> Like [xlabel="n ", dir=none];

    // (5) Post -> Like
    Post -> r_receive_like [xlabel=" 1", dir=none];
    r_receive_like -> Like [xlabel="n ", dir=none];

    // (6) User -> Favorite
    User -> r_make_favorite [xlabel=" 1", dir=none];
    r_make_favorite -> Favorite [xlabel="n ", dir=none];

    // (6) Post -> Favorite
    Post -> r_is_favorite [xlabel=" 1", dir=none];
    r_is_favorite -> Favorite [xlabel="n ", dir=none];

    // --- 其他User 1:N关系 ---
    // (6) User -> Notification
    User -> r_notify [xlabel=" 1", dir=none];
    r_notify -> Notification [xlabel="n ", dir=none];

    // (7) User -> EmailVerificationCode
    User -> r_has_email_code [xlabel=" 1", dir=none];
    r_has_email_code -> EmailVerificationCode [xlabel="n ", dir=none];

    // (7) User -> PasswordResetCode
    User -> r_has_reset_code [xlabel=" 1", dir=none];
    r_has_reset_code -> PasswordResetCode [xlabel="n ", dir=none];

    // --- Comment回复关系 ---
    // (8) Comment -> Comment (自关联)
    Comment -> r_reply [xlabel=" 1", dir=none];
    r_reply -> Comment [xlabel="n ", dir=none];

    // --- 布局优化 ---
    { rank=same; User }
    { rank=same; r_publish; r_write_comment; r_notify; r_has_email_code; r_has_reset_code }
    { rank=same; Post; Notification; EmailVerificationCode; PasswordResetCode }
    { rank=same; r_contain_comment; r_give_like; r_receive_like; r_make_favorite; r_is_favorite }
    { rank=same; Comment; Like; Favorite }
    { rank=same; r_reply }
}
## 图三
digraph 多对多关系图 {
    // --- 全局设置 ---
    graph [rankdir=LR, nodesep=0.8, ranksep=1.0, fontname="SimSun", 
           label="图3：多对多关系（基于描述第3点）", labelloc=t, fontsize=14];
    node [fontname="SimSun", fontsize=12];
    edge [fontname="SimSun", fontsize=12];

    // --- 实体定义 ---
    node [shape=box, style=filled, fillcolor=white, color=black];
    用户 [pos="0,2!"];
    帖子 [pos="4,2!"];
    评论 [pos="8,2!"];
    标签 [pos="12,2!"];
    美食展示 [pos="0,-2!"];
    食物标签 [pos="4,-2!"];

    // --- 关系定义 ---
    node [shape=diamond, width=0.8, height=0.8];
    关注 [pos="2,4!", label="关注\n(Follows表)"];
    点赞帖子 [pos="2,2!", label="点赞帖子\n(PostLikes)"];
    收藏帖子 [pos="2,0!", label="收藏帖子\n(Collections)"];
    点赞评论 [pos="6,2!", label="点赞评论\n(CommentLikes)"];
    标记帖子 [pos="10,2!", label="标记帖子\n(PostTags表)"];
    标记食物 [pos="2,-2!", label="标记食物\n(FoodShowcaseTags表)"];

    // --- 连接关系 ---
    // 用户社交关系（左上区域）
    用户 -> 关注 [xlabel="m", dir=none];
    关注 -> 用户 [xlabel="n", dir=none];

    // 核心内容流（中部水平）
    用户 -> 点赞帖子 [xlabel="m", dir=none];
    点赞帖子 -> 帖子 [xlabel="n", dir=none];
    
    帖子 -> 评论 [xlabel="1", dir=none];
    评论 -> 帖子 [xlabel="n", dir=none];
    
    帖子 -> 标记帖子 [xlabel="m", dir=none];
    标记帖子 -> 标签 [xlabel="n", dir=none];

    // 用户互动（左下区域）
    用户 -> 收藏帖子 [xlabel="m", dir=none];
    收藏帖子 -> 帖子 [xlabel="n", dir=none];
    
    用户 -> 点赞评论 [xlabel="m", dir=none];
    点赞评论 -> 评论 [xlabel="n", dir=none];

    // 美食模块（右侧独立区域）
    美食展示 -> 标记食物 [xlabel="m", dir=none];
    标记食物 -> 食物标签 [xlabel="n", dir=none];

    // --- 布局分区 ---
    subgraph cluster_social {
        label=""; style=invis;
        关注;
    }
    subgraph cluster_content {
        label=""; style=invis;
        帖子; 评论; 标签;
        点赞帖子; 点赞评论; 标记帖子;
    }
    subgraph cluster_food {
        label=""; style=invis;
        美食展示; 标记食物; 食物标签;
    }
}
## 如何使用

    *   **本地安装:** 下载并安装 Graphviz (访问 [graphviz.org](https://graphviz.org/download/))。将代码保存为 `.dot` 文件（例如 `er_diagram.dot`），然后在命令行运行 `dot -Tpng er_diagram.dot -o er_diagram.png` 来生成 PNG 图片 (也可以生成 SVG, PDF 等格式)。
    *   **集成工具:** 某些 Markdown 编辑器或 IDE 插件支持直接渲染 Graphviz 代码。
