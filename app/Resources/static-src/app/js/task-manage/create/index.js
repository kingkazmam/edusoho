import loadAnimation from 'common/load-animation'
import 'jquery-sortable';
import notify from "common/notify";

class Editor {
  constructor($modal) {
    this.$element = $modal;
    this.$task_manage_content = $('#task-create-content');
    this.$task_manage_type = $('#task-create-type');
    this.$frame = null;
    this.$iframe_body = null;
    this.iframe_jQuery = null;
    this.iframe_name = 'task-create-content-iframe';
    this.mode = this.$task_manage_type.data('editorMode');
    this.type = this.$task_manage_type.data('editorType');
    this.step = 1;
    this.loaded = false;
    this.contentUrl = '';
    this._init();
    this._initEvent();
  }

  _initEvent() {
    $('#course-tasks-submit').click(event => this._onSave(event));
    $('#course-tasks-next').click(event => this._onNext(event));
    $('#course-tasks-prev').click(event => this._onPrev(event));
    if (this.mode != 'edit') {
      $('.js-course-tasks-item').click(event => this._onSetType(event));
    } else {
      $('.delete-task').click(event => this._onDelete(event));
    }
  }

  _init() {
    this._inItStep1form();
    this._renderContent(this.step);
    if (this.mode == 'edit') {
      this.contentUrl = this.$task_manage_type.data('editorStep2Url');
      this.step = 2;
      this._switchPage();
    }
  }

  _onNext(e) {
    if (this.step === 3 || !this._validator(this.step)) {
      return;
    }
    this.step += 1;
    this._switchPage();
  }

  _onPrev() {
    if (this.step === 1 || !this._validator(this.step)) {
      return;
    }
    this.step -= 1;
    this._switchPage();
  }

  _onSetType(event) {
    let $this = $(event.currentTarget).addClass('active');
    $this.siblings().removeClass('active');
    let type = $this.data('type');
    $('[name="mediaType"]').val(type);
    this.contentUrl = $this.data('contentUrl');
    this.type !== type ? (this.loaded = false) : (this.loaded = true);
    this.type = type;
    this._renderNext(true);
  }

  _onSave(event) {
    if (!this._validator(this.step)) {
      return;
    }

    $(event.currentTarget).attr('disabled', 'disabled');
    let postData = $('#step1-form').serializeArray()
      .concat(this.$iframe_body.find('#step2-form').serializeArray())
      .concat(this.$iframe_body.find("#step3-form").serializeArray());
    $.post(this.$task_manage_type.data('saveUrl'), postData)
      .done((html) => {
        this.$element.modal('hide');

        let chapterId = postData.find(function(input) {
          return input.name == 'chapterId';
        })

        var add = 0;
        let $parent = $('#' + chapterId.value);

        if ($parent.length) {
          $parent.nextAll().each(function() {
            if ($(this).hasClass('task-manage-chapter')) {
              $(this).before(html);
              add = 1;
              return false;

            }
            if ($parent.hasClass('task-manage-unit') && $(this).hasClass('task-manage-unit')) {
              $(this).before(html);
              add = 1;
              return false;
            }
          });
          if (add != 1) {
            $("#sortable-list").append(html);
            add = 1;
          }
        } else {
          $("#sortable-list").append(html);
        }

        let data = $('#sortable-list').sortable("serialize").get();
        $.post($('#sortable-list').data('sortUrl'), { ids: data }, (response) => {
          if (response) {
            //document.location.reload();
          }
        });

      })
      .fail((response) => {
        this.$element.modal('hide');
      });
  }

  _onDelete(event) {
    let $btn = $(event.currentTarget);
    let url = $btn.data('url');
    if (url === undefined) {
      return;
    }

    $.post(url)
        .then((response) => {
          notify('success', '删除成功');
          this.$element.modal('hide');
          document.location.reload();
        })
        .fail(error => {
          notify('warning', '删除失败~~');
        })
  }

  _switchPage() {
    this._renderStep(this.step);
    this._renderContent(this.step);
    this._rendStepIframe(this.step);
    this._rendButton(this.step);
    if (this.step == 2 && !this.loaded) {
      this._initIframe();
    }
  }

  _initIframe() {
    let html = '<iframe class="' + this.iframe_name + '" id="' + this.iframe_name + '" name="' + this.iframe_name + '" scrolling="no" src="' + this.contentUrl + '"></iframe>';
    this.$task_manage_content.html(html).show();
    this.$frame = $('#' + this.iframe_name).iFrameResize();
    let loadiframe = () => {
      this.loaded = true;
      let validator = {};
      this.iframe_jQuery = this.$frame[0].contentWindow.$;
      this.$iframe_body = this.$frame.contents().find('body').addClass('task-iframe-body');
      this._rendButton(2);
      this.$iframe_body.find("#step2-form").data('validator', validator);
      this.$iframe_body.find("#step3-form").data('validator', validator);

    };
    this.$frame.load(loadAnimation(loadiframe, this.$task_manage_content));
  }

  _inItStep1form() {
    let $step1_form = $("#step1-form");
    let validator = $step1_form.validate({
      rules: {
        mediaType: {
          required: true,
        },
      },
      messages: {
        mediaType: "请选择%display%",
      }
    });
    $step1_form.data('validator', validator);
  }

  _validator(step) {
    let validator = null;
    if (step === 1) {
      validator = $("#step1-form").data('validator');
    } else if (this.loaded) {
      var $from = this.$iframe_body.find("#step" + step + "-form");
      validator = this.iframe_jQuery.data($from[0], 'validator');
    }
    console.log(validator);
    console.log(!validator.form());
    if (validator && !validator.form()) {
      return false;
    }
    return true;
  }

  _rendButton(step) {
    if (step === 1) {
      this._renderPrev(false);
      this._rendSubmit(false);
      this._renderNext(true);
    } else if (step === 2) {
      this._renderPrev(true);
      if (this.mode === 'edit') {
        this._renderPrev(false);
      }
      if (!this.loaded) {
        this._rendSubmit(false);
        this._renderNext(false);
        return;
      }
      this._rendSubmit(true);
      this._renderNext(true);
    } else if (step === 3) {
      this._renderNext(false);
      this._renderPrev(true);
    }
  }

  _rendStepIframe(step) {
    if (!this.loaded) {
      return;
    }
    (step === 2) ? this.$iframe_body.find(".js-step2-view").addClass('active'): this.$iframe_body.find(".js-step2-view").removeClass('active');
    (step === 3) ? this.$iframe_body.find(".js-step3-view").addClass('active'): this.$iframe_body.find(".js-step3-view").removeClass('active');
  }

  _renderStep(step) {
    $('#task-create-step').find('li:eq(' + (step - 1) + ')').addClass('doing').prev().addClass('done').removeClass('doing');
    $('#task-create-step').find('li:eq(' + (step - 1) + ')').next().removeClass('doing').removeClass('done');
  }

  _renderContent(step) {
    (step === 1) ? this.$task_manage_type.removeClass('hidden'): this.$task_manage_type.addClass('hidden');
    (step !== 1) ? this.$task_manage_content.removeClass('hidden'): this.$task_manage_content.addClass('hidden');
  }

  _renderNext(show) {
    show ? $("#course-tasks-next").removeClass('hidden').removeAttr("disabled") : $("#course-tasks-next").addClass('hidden');
  }

  _renderPrev(show) {
    show ? $("#course-tasks-prev").removeClass('hidden') : $("#course-tasks-prev").addClass('hidden');
  }

  _rendSubmit(show) {
    show ? $("#course-tasks-submit").removeClass('hidden') : $("#course-tasks-submit").addClass('hidden');
  }

}

new Editor($('#modal'));