webpackJsonp(["app/js/courseset-manage/header/index"],[function(e,s,t){"use strict";function u(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(s,"__esModule",{value:!0}),s.publishCourseSet=void 0;var n=t("b334fd7e4c5a19234db2"),o=u(n),a=s.publishCourseSet=function(){$("body").on("click",".course-publish-btn",function(e){confirm(Translator.trans("是否确定发布该课程？"))&&$.post($(e.target).data("url"),function(e){e.success?((0,o.default)("success","课程发布成功"),location.reload()):(0,o.default)("danger","课程发布失败："+e.message,5e3)})})};a()}]);