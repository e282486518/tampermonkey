// ==UserScript==
// @name 企业详情字段采集
// @version 1.0.0
// @description 企业详情字段
// @match https://www.tianyancha.com/company/*
// @match https://www.tianyancha.com/nsearch?key=*
// @grant GM_xmlhttpRequest
// @require http://code.jquery.com/jquery-2.1.1.min.js
// @connect cj.13140.cn
// @updateURL https://raw.githubusercontent.com/e282486518/tampermonkey/refs/heads/main/天眼查工商信息.js
// ==/UserScript==

// 项目配置信息
const BeConfig = {
    // 数据回传的url
    ajax_url: "http://cj.13140.cn/?route=Monkey.Content.receive",
    // 驱动器id
    driver_id: "66667246-f818-11ef-9513-00163e060a27",
    // 内容页URL
    //getShowUrl: function () {
    //    return window.location.href;
    //},
    ListClass: ".index_search-box__7YVh6",
    // 列表页字段
    ListFields: {
        'show_url': function (_this) {
            return $(_this).find('.index_name__qEdWi a').attr('href');
        }
    },
    // 内容页字段
    ShowFields: {
        企业名称: function () {
            let tr = $('table.index_tableBox__ZadJW').find('tr');
            let td = tr.eq(0).find('td').eq(1);
            return td.find('.index_copy-box__7b6Aq .index_copy-text__ri7W6').html();
        },
        统一社会信用代码: function () {
            let tr = $('table.index_tableBox__ZadJW').find('tr');
            let td = tr.eq(3).find('td').eq(1);
            return td.find('.index_copy-box__7b6Aq .index_copy-text__ri7W6').html();
        },
        法定代表人: function () {
            let tr = $('table.index_tableBox__ZadJW').find('tr');
            let td = tr.eq(1).find('td').eq(1);
            return td.find("._8b1c5 .link-click").text();
        },
        登记状态: function () {
            let tr = $('table.index_tableBox__ZadJW').find('tr');
            let td = tr.eq(1).find('td').eq(3);
            return td.text();
        },
        企业类型: function () {
            let tr = $('table.index_tableBox__ZadJW').find('tr');
            let td = tr.eq(6).find('td').eq(1);
            return td.text();
        },
        行业: function () {
            let tr = $('table.index_tableBox__ZadJW').find('tr');
            let td = tr.eq(6).find('td').eq(3);
            return td.text();
        },
        成立日期: function () {
            let tr = $('table.index_tableBox__ZadJW').find('tr');
            let td = tr.eq(2).find('td').eq(1);
            return td.text();
        },
        注册资本: function () {
            let tr = $('table.index_tableBox__ZadJW').find('tr');
            let td = tr.eq(3).find('td').eq(3);
            return td.text();
        },
        注册地址: function () {
            let tr = $('table.index_tableBox__ZadJW').find('tr');
            for (let i = 0; i < 4; i++) {
                let td = tr.eq(8 + i).find('td');
                if (td.eq(0).text() == '登记机关') {
                    return td.eq(3).find('.index_copy-box__7b6Aq .index_copy-text__ri7W6').text();
                }
            }
            return '';
        },
        经营范围: function () {
            let tr = $('table.index_tableBox__ZadJW').find('tr');
            for (let i = 0; i < 4; i++) {
                let td = tr.eq(9 + i).find('td');
                if (td.eq(0).text() == '经营范围') {
                    return td.eq(1).find('.index_copy-box__7b6Aq .index_copy-text__ri7W6').text();
                }
            }
            return '';
        },
        邮箱: function () {
            return $('.index_detail-email__B_1Tq').text();
        },
        网址: function () {
            return $('.index_detail-website__n2yst.link-click').text();
        },
        电话: function () {
            return $('.index_detail-tel-content__nZ54h').text();
        },
    }
}

BeMonkey = {

    // 数据回传的url
    ajax_url: BeConfig.ajax_url,

    // 驱动器id
    driver_id: BeConfig.driver_id,

    // 采集步骤: init(初始化), finish(完成), run(运行)
    step: 'init',

    // 链接列表
    links: [],

    // 采集成功后，记录已采集的链接数量
    totalLinks: 0,

    // 链接处理完后, 跳转下个页面间隔时间(毫秒)
    page_stop_time: 1000,
    // 失败后重试间隔时间(毫秒)
    page_fail_time: 300000,

    // 控制台界面-位置
    park: "rt",
    parkMap: {
        lt: ["left", "top"],
        rt: ["right", "top"],
        lb: ["left", "bottom"],
        rb: ["right", "bottom"],
    },

    // ====== 采集字段设置 start =====================================

    getListFields: function (_this) {
        let postDataFields = [];
        // 链接
        //postDataFields.push({
        //    name: 'show_url',
        //    content: fieldValue
        //});
        // 字段
        for (let field in BeConfig.ListFields) {
            let fieldValue = BeConfig.ListFields[field](_this);
            postDataFields.push({
                name: field,
                content: fieldValue
            });
        }
        return postDataFields;
    },

    getShowFields: function () {
        let sHtml = '';
        let postDataFields = [];
        for (let field in BeConfig.ShowFields) {
            let fieldValue = BeConfig.ShowFields[field]();
            postDataFields.push({
                name: field,
                content: fieldValue
            });
            sHtml += '<div style="padding-top: 10px; display: flex;">';
            sHtml += '<div style="flex: 0 0 auto;">' + field + '：</div>';
            sHtml += '<div style="flex: 0 0 auto;">' + fieldValue + '</div>';
            sHtml += "</div>";
        }
        $("#be-monkey-" + this.driver_id + "-fields").html(sHtml);
        return postDataFields;
    },

    // ====== 采集字段设置 end ======================================

    // 初始化
    init: function () {
        // 界面位置
        let park = localStorage.getItem("be:monkey:park");
        if (park) {
            this.park = park;
        }
        // 当前步骤
        let step = localStorage.getItem("be:monkey:step");
        if (step) {
            this.step = step;
        } else {
            this.step = "init";
            localStorage.setItem("be:monkey:step", "init");
        }
        // 已完成数
        let totalLinks = localStorage.getItem("be:monkey:totalLinks");
        if (totalLinks) {
            this.totalLinks = totalLinks;
        }

        // 管理界面
        this.dashboard();

        // 按当前步骤执行操作
        switch (this.step) {
            case "init":
                this.status("待启动...");
                break;
            case "run":
                if (this.totalLinks > 0) {
                    this.processLink();
                } else {
                    this.processLink();
                }
                break;
            case "finish":
                this.status("采集完成！");
                break;
        }
    },

    // ======== 界面 start =====================================

    // 向页面添加控制台界面
    dashboard: function () {
        var sHtml = '<div id="be-monkey-' + this.driver_id + '" style="position: fixed; padding: 15px; background-color: #fff; width: 400px; font-size:14px; z-index: 99999999;  border: #999 1px solid; opacity: 0.95; box-shadow: 0 0 10px #666; transition: all 0.3s;';
        sHtml += this.parkMap[this.park][0] + ': 10px; ' + this.parkMap[this.park][1] + ': 10px;';
        sHtml += '">'
        // 标题
        sHtml += '<div style="font-size: 20px; font-weight: bold;">企业详情字段采集</div>';
        // 按钮
        sHtml += '<div style="padding-top: 10px;">';
        sHtml += '<input type="button" value="' + (this.step === 'init' ? '开如采集' : '重新采集') + '" onclick="BeMonkey.start();">';
        sHtml += '</div>';
        // 状态
        sHtml += '<div style="padding-top: 10px;">';
        sHtml += '当前状态：<span id="be-monkey-' + this.driver_id + '-status"></span>';
        sHtml += "</div>";
        // 计数
        sHtml += '<div style="padding-top: 10px;">';
        sHtml += '剩余数量：<strong>' + this.links.length + '</strong> 个, 已采集: <strong>' + this.totalLinks + '</strong> 个';
        sHtml += "</div>";

        // 字段内容
        sHtml += '<div id="be-monkey-' + this.driver_id + '-fields" style="border-top: 1px solid #c7c5c5;margin-top: 10px;font-size: 10px;"><div style="padding-top: 10px;">字段列表: 无</div></div>';

        // 修改控制台停放位置
        for (let p in this.parkMap) {
            sHtml += '<a id="be-monkey-' + this.driver_id + '-park-' + p + '" style="position: absolute; display: block; width: 10px; height: 10px; ';
            if (this.park === p) {
                sHtml += 'background-color: #00485b;';
            } else {
                sHtml += 'background-color: #ccc;';
            }
            sHtml += this.parkMap[p][0] + ': 0; ' + this.parkMap[p][1] + ': 0;';
            sHtml += '" href="javascript:void(0);" onclick="BeMonkey.changePark(\'' + p + '\');"></a>';
        }

        sHtml += '</div>';
        $('body').append(sHtml);
    },

    // 控制台停放位置
    changePark: function (p) {
        localStorage.setItem('be:monkey:park', p);

        let $e = $("#be-monkey-" + this.driver_id);
        if (this.parkMap[p][0] === 'left') {
            $e.css('left', "10px");
            $e.css('right', "auto");
        } else {
            $e.css('left', "auto");
            $e.css('right', "10px");
        }

        if (this.parkMap[p][1] === 'top') {
            $e.css('top', "10px");
            $e.css('bottom', "auto");
        } else {
            $e.css('top', "auto");
            $e.css('bottom', "10px");
        }

        for (let pp in this.parkMap) {
            let $p = $("#be-monkey-" + this.driver_id + "-park-" + pp);
            if (p === pp) {
                $p.css("background-color", "#00485b");
            } else {
                $p.css("background-color", "#ccc");
            }
        }
    },

    // 设置状态
    status: function (sHtml) {
        $("#be-monkey-" + this.driver_id + "-status").html(sHtml);
    },

    // ========= 界面 end =============================

    // 采集分页页面
    processPage: function () {
        var _this = this;

        let links = [];
        $(BeConfig.ListClass).each(function () {
            links.push(_this.getListFields(this));
        });

        if (links.length > 0) {

            setTimeout(function () {
                window.location.href = links[0]['show_url'];
            }, 1000);
        } else {
            // 列表页中未采集到详情页链接, 直接完成
            this.finish();
        }
    },

    // 采集页面
    processLink: function () {

        this.status("采集链接内容...");

        let postData = {
            pull_driver_id: this.driver_id,
            url: window.location.href,
            fields: this.getShowFields()
        };

        console.log("采集数据回传：", postData);

        let _this = this;

        // 上传文件到账单系统
        GM_xmlhttpRequest({
            method: "POST",
            url: this.ajax_url,
            data: JSON.stringify(postData),
            headers: {
                "Content-Type": "application/json"
            },
            responseType: "json",
            onload: function (response) {
                // 回传失败
                if (response.status !== 200) {
                    _this.httperror('状态码非200', response);
                    return;
                }
                // 无响应
                if (!response.response) {
                    _this.httperror('无效响应', response);
                    return;
                }
                // 不成功
                if (!response.response.success) {
                    let message = "";
                    if (response.response.message) {
                        message = response.response.message;
                    }
                    _this.httperror(message, response);
                    return;
                }
                // 采集成功后，记录已采集的链接数量
                _this.totalLinks++;
                localStorage.setItem("be:monkey:totalLinks", _this.totalLinks);

                _this.status("当前链接采集完成");

                _this.jump();
            }
        });

    },

    // 处理ajax返回错误
    httperror: function (response, msg) {
        console.log("采集数据回传失败（" + msg + "）：", response);
        this.status("提交数据失败（" + msg + "），" + this.page_fail_time + "毫秒后再次尝试！");
        setTimeout(function () {
            window.location.reload();
        }, this.page_fail_time);
    },

    // 开始按钮点击事件
    start: function () {
        this.step = "run";
        localStorage.setItem("be:monkey:step", "run");

        this.processLink();
    },

    // 停止
    stop: function () {
        this.step = "init";
        localStorage.setItem("be:monkey:step", "init");

        window.location.reload();
    },

    // 跳过
    jump: function () {
        // 移出当前链接
        this.links.shift();
        localStorage.setItem('be:monkey:links', this.links.join("|"));

        if (this.links.length > 0) {
            // 延迟跳转
            setTimeout(function () {
                window.location.href = this.links[0];
            }, this.page_stop_time);
        } else {
            // 完成
            this.finish();
        }
    },

    // 结束
    finish: function () {
        //this.step = "finish";
        //localStorage.setItem("be:monkey:step", "finish");
        this.step = "run";
        localStorage.setItem("be:monkey:step", "run");
        //window.close();
    },

    // base64编码
    base64encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        input = input.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < input.length; n++) {
            var c = input.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        input = utftext;
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
                _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
        }
        return output;
    },

    // 构造当前时间
    getDateTime: function () {
        var date = new Date(),
            Y = date.getFullYear() + '',
            M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1),
            D = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate()),
            h = (date.getHours() < 10 ? '0' + (date.getHours()) : date.getHours()),
            m = (date.getMinutes() < 10 ? '0' + (date.getMinutes()) : date.getMinutes()),
            s = (date.getSeconds() < 10 ? '0' + (date.getSeconds()) : date.getSeconds());
        return Y + "-" + M + "-" + D + " " + h + ":" + m + ":" + s
    }
};

$(function () {
    BeMonkey.init();
});

