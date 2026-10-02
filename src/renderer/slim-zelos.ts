import * as Blockly from 'blockly/core';

class SlimConstantProvider extends Blockly.zelos.ConstantProvider {
  override init() {
    super.init();

    // 极限压缩
    this.MIN_BLOCK_HEIGHT = 20;
    this.MIN_BLOCK_WIDTH = 20;
    this.MIN_BLOCK_HEIGHT_WITH_CHILDREN = 12;
    this.EMPTY_BLOCK_SPACER_HEIGHT = 4;

    this.SMALL_PADDING = 0;
    this.MEDIUM_PADDING = 1;
    this.MEDIUM_LARGE_PADDING = 1;
    this.LARGE_PADDING = 2;

    this.FIELD_TEXT_FONTSIZE = 8;
    this.FIELD_TEXT_FONTWEIGHT = '400';
    this.FIELD_TEXT_LINE_HEIGHT = 1.0;

    this.FIELD_BORDER_RECT_HEIGHT = 14;
    this.FIELD_BORDER_RECT_X_PADDING = 3;
    this.FIELD_BORDER_RECT_Y_PADDING = 0;
    this.FIELD_BORDER_RECT_RADIUS = 2;

    // 下拉箭头尺寸
    this.FIELD_DROPDOWN_SVG_ARROW_SIZE = 6;
    this.FIELD_DROPDOWN_SVG_ARROW_PADDING = 2;
    this.FIELD_DROPDOWN_COLOURED_DIV_SIZE = 6;

    // 六边形和圆角接口的尺寸
    this.NOTCH_WIDTH = 10;
    this.NOTCH_HEIGHT = 3;
    this.CORNER_RADIUS = 4;
  }
}

class SlimRenderer extends Blockly.zelos.Renderer {
  override makeConstants_(): Blockly.zelos.ConstantProvider {
    return new SlimConstantProvider();
  }
}

Blockly.blockRendering.register('slim', SlimRenderer);