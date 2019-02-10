// ==UserScript==
// @name         洛谷超级任务计划（第三方）
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  洛谷超级任务计划（第三方），不限题目数量
// @author       Anguei, Legendword
// @match        https://www.luogu.org/problemnew/show/*
// @match        https://www.luogu.org/
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==


// 将要实现的功能：
// 1. 当 todolist 的 size 小于 30 时，顺便加入洛谷官方 todolist


var runTime = GM_getValue('runTime');
var nowUrl = window.location.href;
var LuoguSuperTodolist = {
    settings: {
        keepOriginalList: false
    }
};
// <a href="/recordnew/lists?uid=53062&pid=P3885" target="_blank">
var myUid = nowUrl == 'https://www.luogu.org/'
    ? document.getElementsByClassName('lg-fg-purple lg-bold')[0].attributes['href'].value.match(/[0-9]+/)[0]
    : document.getElementsByTagName('a')[0].attributes['href'].value.match(/[0-9]+/)[0]; // 获取当前登录账号的 uid（洛谷前端改版后）
console.log(myUid);


function updateRunTime(s = '') {
    if (s == 'first') {
        runTime = 1;
    } else {
        runTime++;
    }
    GM_setValue('runTime', runTime);
}


function syncList() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', nowUrl, false);
    xhr.send(null);
    if (xhr.status == 200) {
        console.log('get original todo list: 200');
        var problems = extractData(xhr.responseText);
        LuoguSuperTodolist.problems = problems;
        initList(); // 把洛谷原计划保存到脚本
    } else {
        return {};
    }

    function extractData(content) {
        var psid = content.split('" target="_blank"><b>');
        var problems = clearData(psid);
        console.log(problems);
        return problems;

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

    function initList() {
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
    }
    // 在Luogu官方任务计划后面添加第三方计划
    var problems = GM_getValue('problems')
    $("h2:contains('智能推荐')").before('<h2>任务计划</h2>');
    for (var i in problems) {
        var state = getState(i);
        color = { 'Y': 'green', 'N': 'black', '?': 'orange' };
        text = { 'Y': '<i class="am-icon-check"></i>', 'N': '<i class="am-icon-minus"></i>', '?': '?' };
        $("h2:contains('智能推荐')").before(
            '<div class="tasklist-item" data-pid="'
            + i
            + '"><div><a href="/recordnew/lists?uid='
            + myUid
            + '&amp;pid='
            + i
            + '" target="_blank"><strong class="lg-fg-'
            + color[state]
            + '">' + text[state]
            + '</strong></a><a class="colored" style="padding-left: 3px" href="/problemnew/show/'
            + i
            + '" target="_blank"><b>'
            + i
            + '</b> '
            + problems[i]
            + '</a></div><div style="margin:10px 0;display:none;" class="tasklist-edit"><button class="am-btn am-btn-sm am-btn-success" data-pid="'
            + i
            + '">完成任务</button><hr></div></div>'
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
        }

        function removeFromList(id, title) {
            var nowList = GM_getValue('problems');
            delete nowList[id];
            GM_setValue('problems', nowList)
        }
    }
}


function start() {
    if (nowUrl == 'https://www.luogu.org/') {
        if (runTime == undefined) { // 首次在首页运行脚本，将原任务计划保存
            updateRunTime('first'); // 为了方便调试，暂时关掉了
            syncList();
        }
        updateMainPageList(); // 更新主页的 todolist
    } else if (nowUrl.match(/problem/) != null) { // 题目页面运行脚本，添加按钮
        addButton();
    }
}


start();
