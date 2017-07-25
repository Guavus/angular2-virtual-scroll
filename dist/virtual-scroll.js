"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var common_1 = require("@angular/common");
var VirtualScrollComponent = (function () {
    function VirtualScrollComponent(element, renderer) {
        this.element = element;
        this.renderer = renderer;
        this.items = [];
        this.bufferAmount = 0;
        this.update = new core_1.EventEmitter();
        this.change = new core_1.EventEmitter();
        this.start = new core_1.EventEmitter();
        this.end = new core_1.EventEmitter();
        this.startupLoop = true;
    }
    VirtualScrollComponent.prototype.onScroll = function (e) {
        this.refresh();
    };
    VirtualScrollComponent.prototype.ngOnInit = function () {
        this.scrollbarWidth = 0; // this.element.nativeElement.offsetWidth - this.element.nativeElement.clientWidth;
        this.scrollbarHeight = 0; // this.element.nativeElement.offsetHeight - this.element.nativeElement.clientHeight;
    };
    VirtualScrollComponent.prototype.ngOnChanges = function (changes) {
        this.previousStart = undefined;
        this.previousEnd = undefined;
        var items = changes.items || {};
        if (changes.items != undefined && items.previousValue == undefined || (items.previousValue != undefined && items.previousValue.length === 0)) {
            this.startupLoop = true;
        }
        this.refresh();
    };
    VirtualScrollComponent.prototype.refresh = function () {
        var _this = this;
        requestAnimationFrame(function () { return _this.calculateItems(); });
    };
    VirtualScrollComponent.prototype.scrollInto = function (item) {
        var index = (this.items || []).indexOf(item);
        if (index < 0 || index >= (this.items || []).length)
            return;
        var d = this.calculateDimensions();
        this.element.nativeElement.scrollTop = Math.floor(index / d.itemsPerRow) * d.childHeight;
        this.refresh();
    };
    VirtualScrollComponent.prototype.countItemsPerRow = function () {
        var offsetTop;
        var itemsPerRow;
        var children = this.contentElementRef.nativeElement.children;
        for (itemsPerRow = 0; itemsPerRow < children.length; itemsPerRow++) {
            if (offsetTop != undefined && offsetTop !== children[itemsPerRow].offsetTop)
                break;
            offsetTop = children[itemsPerRow].offsetTop;
        }
        return itemsPerRow;
    };
    VirtualScrollComponent.prototype.calculateDimensions = function () {
        var el = this.element.nativeElement;
        var content = this.contentElementRef.nativeElement;
        var items = this.items || [];
        var itemCount = items.length;
        var viewWidth = el.clientWidth - this.scrollbarWidth;
        var viewHeight = el.clientHeight - this.scrollbarHeight;
        var contentDimensions;
        if (this.childWidth == undefined || this.childHeight == undefined) {
            contentDimensions = content.children[0] ? content.children[0].getBoundingClientRect() : {
                width: viewWidth,
                height: viewHeight
            };
        }
        var childWidth = this.childWidth || contentDimensions.width;
        var childHeight = this.childHeight || contentDimensions.height;
        var itemsPerRow = Math.max(1, this.countItemsPerRow());
        var itemsPerRowByCalc = Math.max(1, Math.floor(viewWidth / childWidth));
        var itemsPerCol = Math.max(1, Math.floor(viewHeight / childHeight));
        var scrollTop = Math.max(0, el.scrollTop);
        if (itemsPerCol === 1 && Math.floor(scrollTop / this.scrollHeight * itemCount) + itemsPerRowByCalc >= itemCount) {
            itemsPerRow = itemsPerRowByCalc;
        }
        return {
            itemCount: itemCount,
            viewWidth: viewWidth,
            viewHeight: viewHeight,
            childWidth: childWidth,
            childHeight: childHeight,
            itemsPerRow: itemsPerRow,
            itemsPerCol: itemsPerCol,
            itemsPerRowByCalc: itemsPerRowByCalc
        };
    };
    VirtualScrollComponent.prototype.calculateItems = function () {
        var el = this.element.nativeElement;
        var d = this.calculateDimensions();
        var items = this.items || [];
        this.scrollHeight = d.childHeight * d.itemCount / d.itemsPerRow;
        if (this.element.nativeElement.scrollTop > this.scrollHeight) {
            this.element.nativeElement.scrollTop = this.scrollHeight;
        }
        var scrollTop = Math.max(0, el.scrollTop);
        var indexByScrollTop = scrollTop / this.scrollHeight * d.itemCount / d.itemsPerRow;
        var end = Math.min(d.itemCount, Math.ceil(indexByScrollTop) * d.itemsPerRow + d.itemsPerRow * (d.itemsPerCol + 1));
        var maxStartEnd = end;
        var modEnd = end % d.itemsPerRow;
        if (modEnd) {
            maxStartEnd = end + d.itemsPerRow - modEnd;
        }
        var maxStart = Math.max(0, maxStartEnd - d.itemsPerCol * d.itemsPerRow - d.itemsPerRow);
        var start = Math.min(maxStart, Math.floor(indexByScrollTop) * d.itemsPerRow);
        this.topPadding = d.childHeight * Math.ceil(start / d.itemsPerRow);
        start = !isNaN(start) ? start : -1;
        end = !isNaN(end) ? end : -1;
        start -= this.bufferAmount;
        start = Math.max(0, start);
        end += this.bufferAmount;
        end = Math.min(items.length, end);
        if (start !== this.previousStart || end !== this.previousEnd) {
            // update the scroll list
            this.update.emit(items.slice(start, end));
            // emit 'start' event
            if (start !== this.previousStart && this.startupLoop === false) {
                this.start.emit({ start: start, end: end });
            }
            // emit 'end' event
            if (end !== this.previousEnd && this.startupLoop === false) {
                this.end.emit({ start: start, end: end });
            }
            this.previousStart = start;
            this.previousEnd = end;
            if (this.startupLoop === true) {
                this.refresh();
            }
            else {
                this.change.emit({ start: start, end: end });
            }
        }
        else if (this.startupLoop === true) {
            this.startupLoop = false;
            this.refresh();
        }
    };
    VirtualScrollComponent.decorators = [
        { type: core_1.Component, args: [{
                    selector: 'virtual-scroll,[virtualScroll]',
                    exportAs: 'virtualScroll',
                    template: "\n    <div class=\"total-padding\" [style.height]=\"scrollHeight + 'px'\"></div>\n    <div class=\"scrollable-content\" #content [style.transform]=\"'translateY(' + topPadding + 'px)'\">\n      <ng-content></ng-content>\n    </div>\n  ",
                    styles: ["\n    :host {\n      overflow: hidden;\n      overflow-y: auto;\n      position: relative;\n      -webkit-overflow-scrolling: touch;\n    }\n    .scrollable-content {\n      top: 0;\n      left: 0;\n      width: 100%;\n      height: 100%;\n      position: absolute;\n    }\n    .total-padding {\n      width: 1px;\n      opacity: 0;\n    }\n  "]
                },] },
    ];
    /** @nocollapse */
    VirtualScrollComponent.ctorParameters = function () { return [
        { type: core_1.ElementRef, },
        { type: core_1.Renderer, },
    ]; };
    VirtualScrollComponent.propDecorators = {
        'items': [{ type: core_1.Input },],
        'scrollbarWidth': [{ type: core_1.Input },],
        'scrollbarHeight': [{ type: core_1.Input },],
        'childWidth': [{ type: core_1.Input },],
        'childHeight': [{ type: core_1.Input },],
        'bufferAmount': [{ type: core_1.Input },],
        'update': [{ type: core_1.Output },],
        'change': [{ type: core_1.Output },],
        'start': [{ type: core_1.Output },],
        'end': [{ type: core_1.Output },],
        'contentElementRef': [{ type: core_1.ViewChild, args: ['content', { read: core_1.ElementRef },] },],
        'onScroll': [{ type: core_1.HostListener, args: ['scroll',] },],
    };
    return VirtualScrollComponent;
}());
exports.VirtualScrollComponent = VirtualScrollComponent;
var VirtualScrollModule = (function () {
    function VirtualScrollModule() {
    }
    VirtualScrollModule.decorators = [
        { type: core_1.NgModule, args: [{
                    imports: [common_1.CommonModule],
                    exports: [VirtualScrollComponent],
                    declarations: [VirtualScrollComponent]
                },] },
    ];
    /** @nocollapse */
    VirtualScrollModule.ctorParameters = function () { return []; };
    return VirtualScrollModule;
}());
exports.VirtualScrollModule = VirtualScrollModule;
//# sourceMappingURL=virtual-scroll.js.map