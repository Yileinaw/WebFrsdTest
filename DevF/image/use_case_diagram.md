```mermaid
usecaseDiagram
    %% --- Actors ---
    actor "普通注册用户" as User
    actor "管理员用户" as Admin

    %% --- Use Cases Definitions (ID : "Label") ---
    usecase UC1 as "用户注册与认证"
    usecase UC1_1 as "用户注册"
    usecase UC1_2 as "用户登录"
    usecase UC1_3 as "用户退出"
    usecase UC1_4 as "密码重置"

    usecase UC2 as "内容发布与管理"
    usecase UC2_1 as "发布帖子"
    usecase UC2_2 as "编辑帖子"
    usecase UC2_3 as "删除帖子"

    usecase UC3 as "内容浏览与发现"
    usecase UC3_1 as "浏览信息流"
    usecase UC3_2 as "查看帖子详情"

    usecase UC4 as "社交互动"
    usecase UC4_1 as "点赞帖子"
    usecase UC4_2 as "收藏帖子"
    usecase UC4_3 as "评论帖子"
    usecase UC4_4 as "关注用户"
    usecase UC4_5 as "取关用户"

    usecase UC5 as "用户资料管理"
    usecase UC5_1 as "查看用户资料"
    usecase UC5_2 as "编辑个人资料"

    usecase UC6 as "查看通知"

    usecase UC_Admin as "后台管理"
    usecase UC_Audit as "内容审核"
    usecase UC_UserMgmt as "用户管理"

    %% --- System Boundary (Optional but good practice) ---
    rectangle "WebFrsdTest 系统" {
        %% Place top-level use cases accessible to User
        UC1
        UC2
        UC3
        UC4
        UC5
        UC6
        %% Place Admin specific top-level use case
        UC_Admin
    }

    %% --- Relationships ---
    %% User Associations
    User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6

    %% Admin Associations & Generalization
    Admin --|> User  %% Generalization: Admin is a type of User
    Admin --> UC_Admin %% Admin specific high-level use case
    Admin --> UC_Audit %% Direct association for clarity
    Admin --> UC_UserMgmt %% Direct association for clarity

    %% Include Relationships (Detailing high-level use cases)
    UC1 ..> UC1_1 : <<include>>
    UC1 ..> UC1_2 : <<include>>
    UC1 ..> UC1_3 : <<include>>
    UC1 ..> UC1_4 : <<include>>

    UC2 ..> UC2_1 : <<include>>
    UC2 ..> UC2_2 : <<include>>
    UC2 ..> UC2_3 : <<include>>

    UC3 ..> UC3_1 : <<include>>
    UC3 ..> UC3_2 : <<include>>

    UC4 ..> UC4_1 : <<include>>
    UC4 ..> UC4_2 : <<include>>
    UC4 ..> UC4_3 : <<include>>
    UC4 ..> UC4_4 : <<include>>
    UC4 ..> UC4_5 : <<include>>

    UC5 ..> UC5_1 : <<include>>
    UC5 ..> UC5_2 : <<include>>

    UC_Admin ..> UC_Audit : <<include>>
    UC_Admin ..> UC_UserMgmt : <<include>>