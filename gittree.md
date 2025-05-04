@startuml
title Git Commit Tree - Yileinaw/WebFrsdTest (Based on Explicit Log Parents)

hide empty description
skinparam state {
  BackgroundColor<<Initial>> LightBlue
  BackgroundColor<<Merge>> LightGreen
}

' --- Commits (Short Hashes) ---
state "1e28ab2\nInitial commit" as C1e28ab2 <<Initial>>
state "756e5ae\nfeat: Initial release v1.0" as C756e5ae
state "a2c385a\n初始2.0" as Ca2c385a
state "87599e3\nAdd detailed project doc" as C87599e3
state "27e0b22\nInital 3.0" as C27e0b22
state "dd6d9d8\nInitial 4.0" as Cdd6d9d8
state "f43b76a\nfeat: 项目文档生成 (正式版 1.0)" as Cf43b76a
state "d693573\n稳定版2.0" as Cd693573
state "344f317\nbug修复以及功能调整" as C344f317
state "4951fc1\n已添加 毕业设计.drawio" as C4951fc1
state "f372921\n已添加 毕业设计.drawio" as Cf372921
state "fc3b7d6\nurl.drawio" as Cfc3b7d6
state "65e672d\nMerge branch 'master'" as C65e672d <<Merge>>
state "4a14762\n添加后台仪表盘功能" as C4a14762
state "126044b\n修复仪表盘日期格式化问题" as C126044b
state "54117f5\n部署测试版：添加后端API" as C54117f5
state "18d080a\n部署测试1.0：修复类型错误" as C18d080a

' --- Connections (Based on explicit parent hashes in log) ---
C1e28ab2 --> C756e5ae : 1e28ab2 is parent of 756e5ae
C756e5ae --> Ca2c385a : 756e5ae is parent of a2c385a
Ca2c385a --> C87599e3 : a2c385a is parent of 87599e3
C87599e3 --> C27e0b22 : 87599e3 is parent of 27e0b22
C27e0b22 --> Cdd6d9d8 : 27e0b22 is parent of dd6d9d8
Cdd6d9d8 --> Cf43b76a : dd6d9d8 is parent of f43b76a
Cf43b76a --> Cd693573 : f43b76a is parent of d693573

' Branch from d693573 to 344f317
Cd693573 --> C344f317 : d693573 is parent of 344f317

' Branch from d693573 to 4951fc1 (parallel development?)
Cd693573 --> C4951fc1 : d693573 is parent of 4951fc1
C4951fc1 --> Cf372921 : 4951fc1 is parent of f372921
Cf372921 --> Cfc3b7d6 : f372921 is parent of fc3b7d6

' Merge commit 65e672d
' Parents listed: 344f317c(C344f317), fc3b7d63(Cfc3b7d6)
C344f317 --> C65e672d
Cfc3b7d6 --> C65e672d

' Commit 4a14762
' Parents listed: af76d391(Not Found), 4f8f2c0d(Not Found)
' Cannot connect based on log, showing as detached or relate to 65e672d if implied by log order
' C65e672d --> C4a14762 : Link assumed from log order if parents missing

' Commit 126044b
' Parents listed: b0dd2c5e(Not Found), 65e672d0(C65e672d)
C65e672d --> C126044b : Explicit parent link
' Note: Missing parent b0dd2c5e...

' Commit 54117f5
' Parents listed: 4fd4d3dc(Not Found), 4f8f2c0d(Not Found)
' Cannot connect based on log. Maybe related to 126044b?
' C126044b --> C54117f5 : Link assumed from log order if parents missing

' Commit 18d080a
' Parents listed: 1b954117(Not Found), 074445ed(Not Found), 4fd4d3dc(Not Found)
' Cannot connect based on log. Maybe related to 54117f5?
' C54117f5 --> C18d080a : Link assumed from log order if parents missing

note left of C4a14762 : Parents af76d391, 4f8f2c0d not found in log excerpt. Connection might be missing.
note left of C126044b : Parent b0dd2c5e not found.
note left of C54117f5 : Parents 4fd4d3dc, 4f8f2c0d not found.
note left of C18d080a : Parents 1b954117, 074445ed, 4fd4d3dc not found.

@enduml