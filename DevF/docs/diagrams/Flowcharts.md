用户认证与授权模块
1.职责:管理用户身份验证、会话管理、密码安全及基础的角色权限控制（区分普通用户和管理员）。
2.核心流程:
（1）注册:接收用户输入（用户名、邮箱、密码），后端进行校验（如邮箱格式、是否已注册），密码使用bcrypt加盐哈希后存入数据库User表。
（2）登录:验证用户凭证，成功后使用jsonwebtoken生成JWT，返回给前端。
（3）认证:前端请求需授权接口时携带JWT，后端通过中间件验证JWT的有效性。
	（4）密码找回/邮箱验证:通过邮件发送验证码或重置链接。
uml:
@startuml
title 用户认证与授权流程

partition 注册 {
  start
  :用户输入注册信息\n(用户名, 邮箱, 密码);
  :后端进行校验\n(邮箱格式, 是否已注册);
  if (校验通过?) then (是)
    :使用 bcrypt 加盐哈希密码;
    :将用户信息存入数据库 User 表;
    :注册成功;
    note right: 可选触发\n邮件验证流程
  else (否)
    :返回注册失败信息;
  endif
  stop
}

newpage 登录与认证

partition 登录 {
  start
  :用户输入登录凭证;
  :后端验证凭证;
  if (验证成功?) then (是)
    :使用 jsonwebtoken 生成 JWT;
    :返回 JWT 给前端;
  else (否)
    :返回登录失败信息;
    stop
  endif
}
partition 接口认证 {
  :前端请求需授权接口\n并携带 JWT;
  :后端中间件验证 JWT 有效性;
  if (JWT 有效?) then (是)
   :处理请求;
  else (否)
   :返回 401 未授权错误;
  endif
  stop
}

newpage 密码找回/邮箱验证

start
:用户请求密码找回/邮箱验证;
:后端生成验证码或重置链接;
:通过邮件发送给用户;
:用户点击链接或输入验证码;
:后端验证有效性;
if (验证通过?) then (是)
  :更新密码或验证状态;
  :通知用户操作成功;
else (否)
  :通知用户操作失败;
endif
stop

@enduml
用户个人空间模块
1.职责：提供个人信息及活动管理界面。
2.核心功能（关联“User”及其关联模型）：
（1）查询：通过“/users/me”或“/users/:username”获取公开信息（“name”“avatarUrl”“bio”等）。
（2）更新：修改“name”“avatarUrl”“bio”等字段。
（3）活动聚合：
1）我的帖子：查询用户作为“author”的“Post”列表。
2）我的收藏：查询“Favorite”表中关联的“Post”。
3）关注/粉丝：查询“Follows”表中的“User”列表。
4）我的点赞：通过“User.likedPosts”查询点赞记录。

uml:
@startuml
title 用户个人空间流程

partition 查询用户信息 {
  start
  :前端请求 /users/me 或 /users/:username;
  :后端根据请求类型\n获取目标用户信息;
  :返回用户公开信息\n(name, avatarUrl, bio等);
  stop
}

newpage 更新用户信息

partition 更新用户信息 {
  start
  :用户提交需更新的信息\n(name, avatarUrl, bio等);
  :后端验证用户权限及数据;
  if (验证通过?) then (是)
    :更新数据库中的用户信息;
    :返回成功状态;
  else (否)
    :返回错误信息;
  endif
  stop
}

newpage 查询用户活动

partition 查询用户活动 {
  start
  split
    :请求 "我的帖子";
    :查询用户作为 author 的 Post 列表;
    :返回帖子列表;
  split again
    :请求 "我的收藏";
    :查询 Favorite 表中关联的 Post;
    :返回收藏的帖子列表;
  split again
    :请求 "关注/粉丝";
    :查询 Follows 表;
    :返回关注/粉丝 User 列表;
  split again
    :请求 "我的点赞";
    :查询 User.likedPosts 或 Like 表;
    :返回点赞记录/帖子;
  endsplit
  stop
}

@enduml