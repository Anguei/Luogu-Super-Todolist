// ==UserScript==
// @name         洛谷超级任务计划（第三方）
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  洛谷超级任务计划（第三方），不限题目数量
// @author       Anguei, Legendword
// @match        https://www.luogu.org/problemnew/show/*
// @match        https://www.luogu.org/
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==


// 可能将要实现的功能：
// 1. 添加首页的编辑题目按钮
// 2. 当 todolist 的 size 小于 30 时，新加入 superTodolist 的题目同步加入洛谷官方 todolist
// 3. 从 superTodolist 删除题目时，若题目也在洛谷官方 todolist 当中，同步删除
// 4. superTodolist 的导入与导出（以便于与 memset0 的项目配合，以及换电脑之后 superTodolist 的同步）

// 感谢 @memset0 提供创意
// 感谢 @Legendword 协助完成 jQuery 相关代码
// 感谢 @memset0, @Legendword 帮助找 bug


var version = '1.5';
var originalLimit = 28;
var nowUrl = window.location.href;
var LuoguSuperTodolist = {
    settings: {
        keepOriginalList: false,
        debugMode: false // 发布前将此设为false
    }
};
var myUid = document.cookie.match(/_uid=[0-9]+/)[0].substr(5);
console.log(myUid)
console.log('如果上面获取到的 uid 不正确，请反馈作者，谢谢')


function getOriginalList() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://www.luogu.org/', false);
    xhr.send(null);
    if (xhr.status == 200) {
        console.log('get original todo list: 200');
        return extractData(xhr.responseText);
    } else {
        return {};
    }

    function extractData(content) {
        var psid = content.split('" target="_blank"><b>');
        if (psid[0].indexOf("还没有计划完成的题目<br>")!=-1) {
            return {};
        }
        return clearData(psid);

        function clearData(psid) { // psid: problems' id
            var res = {}
            for (var i = 1; i < psid.length; i++) { // 从 1 开始循环，因为 split 导致 psid[0] 是垃圾文本串
                var pId = '', pName = '', j = 0;
                for (; j < psid[i].length; j++) { // 获取题号
                    if (psid[i][j] != '<') {
                        pId = pId.concat(psid[i][j]);
                    } else break;
                }
                for (j += 5; j < psid[i].length; j++) { // 获取题目名称
                    if (psid[i][j] != '<') {
                        pName = pName.concat(psid[i][j]);
                    } else break;
                }
                res[pId] = pName;
                if (psid[i].match(/智能推荐/) != null) break;
            }
            return res;
        }
    }
}


function syncList() {
    console.log('syncing');
    LuoguSuperTodolist.problems = getOriginalList();
    initList(); // 把洛谷原计划保存到脚本

    function initList() {
        var old = GM_getValue('problems');
        if (old != undefined || old != 'undefined') {
            for (var i in old) {
                LuoguSuperTodolist.problems[i] = old[i]
            }
        }
        GM_setValue('problems', LuoguSuperTodolist.problems);
    }
}


function getAc(uid) { // 从原来代码复制过来的
    // 向指定的个人空间发送 get 请求，获取 AC 列表
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://' + window.location.host + '/space/show?uid=' + uid, false);
    xhr.send(null);
    console.log('got ' + uid + "'s AC list: " + xhr.status);
    if (xhr.status == 200) {
        return extractData(xhr.responseText); // 返回 AC 列表
    } else {
        return []; // 空列表
    }

    function extractData(content) {
        // 如果你有一个问题打算用正则表达式来解决，那么就是两个问题了。
        // 所以窝还是用 split() 解决这一个问题吧！
        var acs = content.replace(/<span style=\"display:none\">\n.*?\n<\/span>/g, ''); // 把随机的干扰题号去除
        acs = acs.split('[<a data-pjax href="/problem/show?pid='); // 使用 split() 方法把通过的题目分割出来
        acs = clearData(acs); // 把分割好的数据清洁一下
        return acs;

        function clearData(acs) {
            var res = new Array();
            res.push(new Array());
            res.push(new Array());
            var g = 0;
            for (var i = 1; i < acs.length; i++) { // 把每一行非题号字符删掉（从 1 开始循环为了避开 split 之后产生的垃圾）
                var tmpStr = "";
                for (var j = 0; j < acs[i].length; j++) {
                    if (acs[i][j] != '"') { // 引号后面的不是题号部分字符
                        tmpStr = tmpStr.concat(acs[i][j]); // 拼接字符串
                    }
                    else break;
                }
                res[g].push(tmpStr);
                if (acs[i].length > 50) { // 这是最后一个题目 / 下一个是「尝试过的题目」
                    g++;
                }
            }
            return res;
        }
    }
}


function updateMainPageList() {
    var tmp = getAc(myUid);
    var myAc = tmp[0], myAttempt = tmp[1];
    myAc.sort();
    myAttempt.sort();

    // 清除官方的任务计划
    if (!LuoguSuperTodolist.settings.keepOriginalList) {
        $("h2:contains('智能推荐')").prevAll().remove();
        // 当官方计划为空时，删除那句话
        if ($("h2:contains('智能推荐')").parent().html().indexOf("<h2")>0) {
            $("h2:contains('智能推荐')").parent().html($("h2:contains('智能推荐')").parent().html().slice($("h2:contains('智能推荐')").parent().html().indexOf("<h2")));
        }
    }

    // 在 Luogu 官方任务计划后面添加第三方计划
    var problems = GM_getValue('problems')
    $("h2:contains('智能推荐')").before('<h2>任务计划</h2>');
    for (var i in problems) {
        var state = getState(i);
        var color = { 'Y': 'green', 'N': 'black', '?': 'orange' };
        var content = { 'Y': '<i class="am-icon-check"></i>', 'N': '<i class="am-icon-minus"></i>', '?': '？' };
        $("h2:contains('智能推荐')").before(
            '<div class="tasklist-item" data-pid="'
            + i
            + '"><div><a href="/recordnew/lists?uid='
            + myUid
            + '&amp;pid='
            + i
            + '" target="_blank"><strong class="lg-fg-'
            + color[state]
            + '">' + content[state]
            + '</strong></a>'
            + '<a class="colored" style="padding-left: 3px" href="/problemnew/show/'
            + i
            + '" target="_blank"><b>'
            + i
            + '</b> '
            + problems[i]
            + '</a></div></div>'
        );
    }

    function getState(pid) {
        if (binarySearch(pid, myAc)) return 'Y';
        else if (binarySearch(pid, myAttempt)) return '?';
        else return 'N';
    }

    function binarySearch(target, array) { // 使用二分查找算法进行比较
        var l = 0, r = array.length;
        while (l < r) {
            var mid = parseInt((l + r) / 2); // JavaScript 除法默认不是整数。。
            if (target == array[mid]) return true;
            else if (target > array[mid]) l = mid + 1;
            else r = mid;
        }
        return false;
    }
}


function addButton() {
    $('#remove-tasklist').remove();
    $('#add-tasklist').remove(); // 移除旧的按钮

    var problemId = nowUrl.match(/[A-Z]+[0-9]+/)[0];
    var problemTitle = getTitle();

    if (!isInList()) {
        $(".lg-summary-content")
            .append('<p>'
                + '<a href="javascript: ;" '
                + 'id="update-todolist" '
                + 'class="am-btn am-btn-sm am-btn-primary">'
                + '添加至超级任务计划'
                + '</a>'
                + '</p>');
        $("#update-todolist").click(swapState);
    } else {
        $(".lg-summary-content")
            .append('<p>'
                + '<a href="javascript: ;" '
                + 'id="update-todolist" '
                + 'class="am-btn am-btn-sm am-btn-danger">'
                + '从任务计划移除'
                + '</a>'
                + '</p>');
        $("#update-todolist").click(swapState);
    }

    function getTitle() {
        return document.title.substr((problemId.length + 1), document.title.length - (problemId.length + 1) - 5)
    }

    function isInList() {
        var nowList = GM_getValue('problems');
        if (nowList == undefined) return false;
        return nowList[problemId] != undefined;
    }

    function swapState(ev) { // 是不是应该改成检测现在的属性，然后交换属性
        if (isInList()) { // 已经在任务计划列表，删掉它。变成蓝色按钮
            removeFromList(problemId, problemTitle);
            $("#update-todolist").attr("class", "am-btn am-btn-sm am-btn-primary");
            $("#update-todolist").html("添加至超级任务计划");
        } else { // 不在任务计划当中，加进去，变成红色按钮
            addToList(problemId, problemTitle)
            $("#update-todolist").attr("class", "am-btn am-btn-sm am-btn-danger");
            $("#update-todolist").html("从任务计划移除");
        }

        function addToList(id, title) {
            var nowList = GM_getValue('problems');
            nowList[id] = title;
            GM_setValue('problems', nowList);
            LuoguSuperTodolist.problems = GM_getValue('problems')
            if (getDictLength(getOriginalList()) < originalLimit) { // 原计划长度足够装下新题目，装进去
                $.post("/api/user/tasklistAdd", { pid: id });
            }
        }

        function removeFromList(id, title) {
            var nowList = GM_getValue('problems');
            delete nowList[id];
            GM_setValue('problems', nowList);
            LuoguSuperTodolist.problems = GM_getValue('problems')
            var originalList = getOriginalList();
            if (findInDict(id, originalList)) { // 删除的题目在原计划当中，在原计划也删除
                $.post("/api/user/tasklistRemove", { pid: id })
            }
            checkOther(); // 看剩余空间够不够再同步几道题进去

            function findInDict(target, dict) {
                for (var i in dict) if (i == target) return true;
                return false;
            }

            function checkOther() {
                var diff = originalLimit - (getDictLength(originalList) - 1); // 长度 - 1 是因为刚才删掉了一个
                console.log(diff);
                if (diff > 0) {
                    var cnt = 0;
                    var arr = new Array();
                    for (var i in LuoguSuperTodolist.problems) {
                        if (!findInDict(i, originalList)) { // superList 当中不在 originalList 的题目
                            arr.push(i);
                            cnt += 1;
                            if (cnt == diff) break;
                        }
                    }
                    for (var i = 0; i < arr.length; i++) {
                        $.post("/api/user/tasklistAdd", { pid: arr[i] });
                    }
                }
            }
        }

        function getDictLength(dict) {
            var res = 0;
            for (var i in dict) res++;
            return res;
        }
    }
}


function start() {
    var lastVersion = GM_getValue('version');
    if ((lastVersion != version)||LuoguSuperTodolist.settings.debugMode) { // 首次运行脚本，将原任务计划保存
        console.log('更新后首次运行脚本，请耐心等待初始化');
        syncList();
    }
    LuoguSuperTodolist.problems = GM_getValue('problems')
    if (nowUrl == 'https://www.luogu.org/') {
        updateMainPageList(); // 更新主页的 todolist
    } else if (nowUrl.match(/problem/) != null) { // 题目页面运行脚本，添加按钮
        addButton();
    }
    GM_setValue('version', version);
}


start();
