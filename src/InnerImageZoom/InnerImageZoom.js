import React, { Component, Fragment, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import Image from './components/Image';
import Loader from './components/loader';
const ZoomImage = lazy(() => import('./components/ZoomImage'));
const FullscreenPortal = lazy(() => import('./components/FullscreenPortal'));
class InnerImageZoom extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isActive: (props.startsActive === true ? true : false),
      isTouch: false,
      isZoomed: false,
      isFullscreen: false,
      isDragging: false,
      currentMoveType: props.moveType,
      left: 0,
      top: 0
    };

    this.setDefaults();
  }

  handleMouseEnter = (e) => {
    this.setState({
      isActive: true
    });

    if (this.props.zoomType === 'hover' && !this.state.isZoomed) {
      this.handleClick(e);
    }
  }

  handleTouchStart = () => {
    const isFullscreen = this.props.fullscreenOnMobile && window.matchMedia && window.matchMedia(`(max-width: ${this.props.mobileBreakpoint}px)`).matches;

    this.setState({
      isTouch: true,
      isFullscreen: isFullscreen,
      currentMoveType: 'drag'
    });
  }

  handleClick = (e) => {
    if (this.state.isZoomed) {
      if (!this.state.isTouch && !this.state.isDragging) {
        this.zoomOut();
      }

      return;
    }

    if (this.state.isTouch) {
      this.setState({
        isActive: true
      });
    }

    if (this.isLoaded) {
      this.zoomIn(e.pageX, e.pageY);
    } else {
      this.onLoadCallback = this.zoomIn.bind(this, e.pageX, e.pageY);
    }
  }

  handleLoad = (e) => {
    this.isLoaded = true;
    this.zoomImg = e.target;
    const zoomImageClientRect = this.zoomImg.getClientRects()[0]
    this.zoomImg.setAttribute('width', zoomImageClientRect.width * this.props.zoomScale);
    this.zoomImg.setAttribute('height', zoomImageClientRect.height * this.props.zoomScale);
    this.bounds = this.getBounds(this.img, false);
    this.ratios = this.getRatios(this.bounds, this.zoomImg);

    if (this.onLoadCallback) {
      this.onLoadCallback();
      this.onLoadCallback = null;
    }
  }

  handleMouseMove = (e) => {
    const leftDelta = e.pageX - this.offsets.x;
    const topDelta = e.pageY - this.offsets.y;
    const left = Math.max(Math.min(leftDelta, this.bounds.width), 0);
    const top = Math.max(Math.min(topDelta, this.bounds.height), 0);

    window.requestAnimationFrame(function () {
      if (!this.zoomImg) {
        return
      }
      this.zoomImg.style.transform = `translate(${left * -this.ratios.x}px, ${top * -this.ratios.y}px)`
      this.zoomImg.style.top = `-${this.bounds.height}px`
    }.bind(this))
  }

  handleDragStart = (e) => {
    const zoomImageClientRect = this.zoomImg.getClientRects()[0]
    this.offsets = this.getOffsets((e.pageX || e.changedTouches[0].pageX), (e.pageY || e.changedTouches[0].pageY), zoomImageClientRect.left, zoomImageClientRect.top);
    this.zoomImg.addEventListener(this.state.isTouch ? 'touchmove' : 'mousemove', this.handleDragMove, { passive: true });

    if (!this.state.isTouch) {
      this.eventPosition = {
        x: e.pageX,
        y: e.pageY
      };
    }
  }

  handleDragMove = (e) => {
    e.stopPropagation();
    window.requestAnimationFrame(function (e) {
      if (!this.zoomImg) {
        return
      }
      const { pageX, pageY, changedTouches } = e
      const leftDelta = (pageX || changedTouches[0].pageX) - this.offsets.x;
      const topDelta = (pageY || changedTouches[0].pageY) - this.offsets.y;
      const zoomImageClientRect = this.zoomImg.getClientRects()[0]
      const left = Math.max(Math.min(leftDelta, 0), (zoomImageClientRect.width - this.bounds.width) * -1);
      const top = Math.max(Math.min(topDelta, 0), (zoomImageClientRect.height - this.bounds.height) * -1);
      this.zoomImg.style.transform = `translate(${left}px, ${top}px)`
    }.bind(this, e))
  }

  handleDragEnd = (e) => {
    this.zoomImg.removeEventListener(this.state.isTouch ? 'touchmove' : 'mousemove', this.handleDragMove);

    if (!this.state.isTouch) {
      const moveX = Math.abs(e.pageX - this.eventPosition.x);
      const moveY = Math.abs(e.pageY - this.eventPosition.y);

      this.setState({
        isDragging: moveX > 5 || moveY > 5
      });
    }
  }

  handleMouseLeave = (e) => {
    this.state.currentMoveType === 'drag' && this.state.isZoomed ? this.handleDragEnd(e) : this.handleClose();
  }

  handleClose = () => {
    this.zoomOut(() => {
      this.setDefaults();
      setTimeout(() => {
        this.setState({
          isActive: false,
          isTouch: false,
          isFullscreen: false,
          currentMoveType: this.props.moveType
        })
      }, 0);
    });
  }

  initialMove = (pageX, pageY) => {
    this.offsets = this.getOffsets(window.pageXOffset, window.pageYOffset, -this.bounds.left, -this.bounds.top);

    this.handleMouseMove({
      pageX,
      pageY
    });
  }

  initialDragMove = (pageX, pageY) => {
    const initialPageX = (pageX - (window.pageXOffset + this.bounds.left)) * -this.ratios.x;
    const initialPageY = (pageY - (window.pageYOffset + this.bounds.top)) * -this.ratios.y;

    this.bounds = this.getBounds(this.img, this.state.isFullscreen);
    this.offsets = this.getOffsets(0, 0, 0, 0);

    this.handleDragMove({
      changedTouches: [{
        pageX: initialPageX,
        pageY: initialPageY
      }],
      preventDefault: () => { },
      stopPropagation: () => { }
    });
  }

  zoomIn = (pageX, pageY) => {
    this.setState({
      isZoomed: true
    }, () => {
      const initialMove = this.state.currentMoveType === 'drag' ? this.initialDragMove : this.initialMove;
      initialMove(pageX, pageY);

      if (this.props.afterZoomIn) {
        this.props.afterZoomIn();
      }
    });
  }

  zoomOut = (callback) => {
    this.setState({
      isZoomed: false
    }, () => {
      if (this.props.afterZoomOut) {
        this.props.afterZoomOut();
      }

      if (callback) {
        callback();
      }
    });
  }

  setDefaults = () => {
    this.isLoaded = false;
    this.onLoadCallback = null;
    this.zoomImg = null;
    this.bounds = {};
    this.offsets = {};
    this.ratios = {};
    this.eventPosition = {};
  }

  getBounds = (img, isFullscreen) => {
    if (isFullscreen) {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        left: 0,
        top: 0
      };
    }

    return img.getBoundingClientRect();
  }

  getOffsets = (pageX, pageY, left, top) => {
    return {
      x: pageX - left,
      y: pageY - top
    };
  }

  getRatios = (bounds, zoomImg) => {
    const zoomImageClientRect = zoomImg.getClientRects()[0]

    return {
      x: (zoomImageClientRect.width - bounds.width) / bounds.width,
      y: (zoomImageClientRect.height - bounds.height) / bounds.height
    };
  }

  render() {
    const {
      src,
      srcSet,
      sizes,
      sources,
      zoomSrc,
      alt,
      fadeDuration,
      className
    } = this.props;

    const {
      isActive,
      isLoaded,
      isFullscreen,
      isZoomed,
      isTouch,
      currentMoveType
    } = this.state;

    const setImgRef = (el) => { this.img = el }

    const zoomImageProps = {
      src: zoomSrc || src,
      fadeDuration: isFullscreen ? 0 : fadeDuration,
      isZoomed: isZoomed,
      onLoad: this.handleLoad,
      onDragStart: this.handleDragStart,
      onDragEnd: this.handleDragEnd,
      onClose: isTouch ? this.handleClose : null
    };

    return (
      <figure
        className={`iiz ${currentMoveType === 'drag' ? 'iiz--drag' : ''} ${className ? className : ''}`}
        ref={setImgRef}
        onTouchStart={this.handleTouchStart}
        onClick={this.handleClick}
        onMouseEnter={isTouch ? null : this.handleMouseEnter}
        onMouseMove={currentMoveType === 'drag' || !isZoomed ? null : this.handleMouseMove}
        onMouseLeave={isTouch ? null : this.handleMouseLeave}
      >
        <Image
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          sources={sources}
          alt={alt}
          fadeDuration={this.props.fadeDuration}
          isZoomed={isZoomed}
        />

        {isActive &&
          <Fragment>
            {isFullscreen ? (
              <Suspense fallback={<Loader />}>
                <FullscreenPortal className="iiz__zoom-portal">
                  <ZoomImage {...zoomImageProps} />
                </FullscreenPortal>
              </Suspense>
            ) : (
                <Suspense fallback={<Loader />}>
                  <ZoomImage {...zoomImageProps} />
                </Suspense>
              )}
            {!isZoomed && !isLoaded && <Loader />}
          </Fragment>
        }

        {!isZoomed &&
          <span className="iiz__btn iiz__hint"></span>
        }
      </figure>
    );
  }
}

InnerImageZoom.propTypes = {
  moveType: PropTypes.string,
  zoomType: PropTypes.string,
  src: PropTypes.string.isRequired,
  srcSet: PropTypes.string,
  sizes: PropTypes.string,
  sources: PropTypes.array,
  zoomSrc: PropTypes.string,
  zoomScale: PropTypes.number,
  alt: PropTypes.string,
  fadeDuration: PropTypes.number,
  fullscreenOnMobile: PropTypes.bool,
  mobileBreakpoint: PropTypes.number,
  className: PropTypes.string,
  afterZoomIn: PropTypes.func,
  afterZoomOut: PropTypes.func,
  startsActive: PropTypes.bool
};

InnerImageZoom.defaultProps = {
  moveType: 'pan',
  zoomType: 'click',
  zoomScale: 1,
  fadeDuration: 150,
  mobileBreakpoint: 640
};

export default InnerImageZoom;
