// ==UserScript==
// @name         洛谷第三方任务计划
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  洛谷第三方任务计划，不限题目数量
// @author       Anguei, Legendword
// @match        https://www.luogu.org/problemnew/show/*
// @match        https://www.luogu.org/
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==


// 将要实现的功能：
// 1. 当 todolist 的 size 小于 30 时，顺便加入洛谷官方 todolist
// 2. 在 res[pId] 中保存加入 todolist 的时间、该题的题目得分（用字典套数组实现）
// 3. 发布脚本时，不要忘记去掉 updateRuntime('first') 的注释
// 4. 如果显示分数的开销太高 / 太困难，可以考虑改为「通过 / 尝试过 / 未做」


var runTime = GM_getValue('runTime');
// console.log(runTime);
var nowUrl = window.location.href;
var LuoguSuperTodolist = {
    settings: {
        keepOriginalList: false
    }
};


function updateRunTime(s = '') {
    if (s == 'first') {
        console.log('首次运行，同步数据中，请耐心等待片刻');
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
        initList();
        updateMainPageList();
    } else {
        return [];
    }

    function extractData(content) {
        var psid = content.split('" target="_blank"><b>');
        var problems = clearData(psid);
        console.log(problems);
        return problems;

        function clearData(psid) {
            console.log(psid);
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

function updateMainPageList() {
    //清除官方的任务计划
    if (!LuoguSuperTodolist.settings.keepOriginalList) {
        $("h2:contains('智能推荐')").prevAll().remove();
    }
    //在Luogu官方任务计划后面添加第三方计划
    var problems = LuoguSuperTodolist.problems;
    $("h2:contains('智能推荐')").before('<h2>任务计划</h2>');
    for (var i in problems) {
        $("h2:contains('智能推荐')").before('<div class="tasklist-item"><div><a class="colored" style="padding-left: 3px" href="/problemnew/show/'+i+'" target="_blank"><b>'+i+'</b> '+problems[i]+'</a></div></div>');
    }
}


function addButton() {
    var problemId = nowUrl.match(/[A-Z]+[0-9]+/)[0];
    var problemTitle = getTitle();
    // console.log(problemTitle);

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
        // console.log(document.title)
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
            console.log(nowList);
            GM_setValue('problems', nowList);
        }

        function removeFromList(id, title) {
            var nowList = GM_getValue('problems');
            delete nowList[id];
            console.log(nowList);
            GM_setValue('problems', nowList)
        }
    }
}


function start() {
    if (nowUrl == 'https://www.luogu.org/') {
        if (runTime == undefined) { // 首次在首页运行脚本，将原任务计划保存
            // updateRunTime('first'); // 为了方便调试，暂时关掉了
            syncList();
        } else {
            updateMainPageList(); // 不是首次运行，更新 todolist
        }
    } else if (nowUrl.match(/problem/) != null) { // 题目页面运行脚本，更新题目分数、添加按钮
        addButton();
        updateScore();
    }
}


start();
