# Luogu-Super-Todolist

还在为「任务计划爆满」而烦恼吗？

这是一个第三方洛谷超级任务计划脚本，不限任务计划长度，直接运行在洛谷题目页面和首页，支持显示通过状态，方便快捷！

## 安装方法

请不要使用 GitHub 的 `Clone or download` 按钮安装脚本！

**注意：这是一个用户脚本（userscript），在使用之前，请确保您的浏览器安装了 Tampermonkey 插件**：
- [Chrome 插件下载](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- [Firefox 插件下载](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/)

确保您的浏览器安装 Tampermonkey 插件后，单击该图片安装脚本：![](https://s2.ax1x.com/2019/02/10/kaCnRU.png)

## 使用示例

### 在题目页面：

进入任意题目界面，脚本会自动判断该题目是否在任务计划中，并对页面进行相应修改，如图：

![](https://s2.ax1x.com/2019/02/10/ka96v4.png) ![](https://s2.ax1x.com/2019/02/10/ka92r9.png)

用户可以使用按钮对任务计划进行添加和删除操作。

**如果是第一次运行脚本，脚本会自动同步洛谷原任务计划到脚本的 superTodolist 当中。**

### 在洛谷首页

进入洛谷首页，脚本会自动将首页任务计划更新为 SuperTodolist，并保证原有题目顺序不变。脚本使用绿色对勾表示已通过题目，橙色问号表示尝试过的题目，黑色横线表示未做题目。由于获取题目分数需要较大开销，所以暂时无此功能。如图：

![](https://s2.ax1x.com/2019/02/10/ka9bKH.png)

## 不完善之处

- 尚不支持展示题目分数。
- 尚未添加洛谷首页直观的任务计划编辑按钮。从任务计划删除题目可以从题目页面单个执行。
- 尚不支持 superTodolist 的添加 / 删除操作同步到洛谷原计划列表

## 鸣谢

- @memset0 提供创意
- @Legendword 协助 jQuery 部分代码
- @memeset0, @Legendword 找出 bug