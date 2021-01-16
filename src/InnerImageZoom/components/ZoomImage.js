import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

const ZoomImage = ({ 
  src,
  fadeDuration,
  isZoomed,
  onLoad,
  onDragStart,
  onDragEnd,
  onClose }) => (
  <Fragment>
    <div className="iiz__zoom-img__wrapper">
      <img
        className={`iiz__zoom-img ${isZoomed ? 'iiz__zoom-img--visible' : ''}`}
        style={{
          transition: `linear ${fadeDuration}ms opacity`
        }}
        src={src}
        onLoad={onLoad}
        onTouchStart={onDragStart}
        onTouchEnd={onDragEnd}
        onMouseDown={onDragStart}
        onMouseUp={onDragEnd}
        alt=""
      />
    </div>
    {onClose &&
      <button
        className={`iiz__btn iiz__close ${isZoomed ? 'iiz__close--visible' : ''}`}
        style={{
          transition: `linear ${fadeDuration}ms opacity`
        }}
        onClick={onClose}
        aria-label="Zoom Out"
      />
    }
  </Fragment>
);

ZoomImage.propTypes = {
  src: PropTypes.string,
  fadeDuration: PropTypes.number,
  isZoomed: PropTypes.bool,
  onLoad: PropTypes.func,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  onClose: PropTypes.func
};

export default ZoomImage;