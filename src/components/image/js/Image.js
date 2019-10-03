// Image component to be used with https://github.com/Brigad/ideal-image-loader

/* eslint-disable */
import GatsbyImage from 'gatsby-image';
import PropTypes from 'prop-types';
import React from 'react';
/* eslint-enable */

const Image = ({ src, alt, height, width, className, fluid }) => {
  const x1 = src && src.x1 ? src.x1 : src;
  const x2 = src && src.x2 ? src.x2 : null;
  const x3 = src && src.x3 ? src.x3 : null;

  const base64 = x1 && x1.preSrc ? x1.preSrc : '';

  const src1 = x1 && x1.src ? x1.src : x1;
  const src2 = x2 && x2.src ? x2.src : '';
  const src3 = x3 && x3.src ? x3.src : '';
  const webp1 = x1 && x1.webp ? x1.webp : '';
  const webp2 = x2 && x2.webp ? x2.webp : '';
  const webp3 = x3 && x3.webp ? x3.webp : '';

  const src1FormattedFluid = src1 ? `${src1} ${width}w` : '';
  const src2FormattedFluid = src2 ? `${src2} ${width * 2}w` : '';
  const src3FormattedFluid = src3 ? `${src3} ${width * 3}w` : '';
  const webp1FormattedFluid = webp1 ? `${webp1} ${width}w` : '';
  const webp2FormattedFluid = webp2 ? `${webp2} ${width * 2}w` : '';
  const webp3FormattedFluid = webp3 ? `${webp3} ${width * 3}w` : '';

  const src1FormattedFixed = src1;
  const src2FormattedFixed = src2 ? `${src2} 2x` : '';
  const src3FormattedFixed = src3 ? `${src3} 3x` : '';
  const webp1FormattedFixed = webp1;
  const webp2FormattedFixed = webp2 ? `${webp2} 2x` : '';
  const webp3FormattedFixed = webp3 ? `${webp3} 3x` : '';

  const srcSet = (fluid
    ? [src1FormattedFluid, src2FormattedFluid, src3FormattedFluid]
    : [src1FormattedFixed, src2FormattedFixed, src3FormattedFixed]
  )
    .filter(Boolean)
    .join(', ');
  const srcSetWebp = (fluid
    ? [webp1FormattedFluid, webp2FormattedFluid, webp3FormattedFluid]
    : [webp1FormattedFixed, webp2FormattedFixed, webp3FormattedFixed]
  )
    .filter(Boolean)
    .join(', ');

  const imgObj = {
    ...(fluid
      ? {
          aspectRatio: width / height,
          sizes: `(max-width: ${width * 3}px) 100vw, ${width * 3}px`,
        }
      : {
          height,
          width,
        }),
    base64,
    src: src2 || src1,
    srcWebp: webp2 || webp1,
    srcSet,
    srcSetWebp,
  };

  return (
    <GatsbyImage
      fluid={fluid ? imgObj : null}
      fixed={!fluid ? imgObj : null}
      alt={alt}
      className={className}
    />
  );
};

Image.propTypes = {
  src: PropTypes.oneOfType([
    // The image has been loaded with https://github.com/Brigad/ideal-image-loader
    PropTypes.shape({
      x1: PropTypes.shape({
        src: PropTypes.string.isRequired,
        preSrc: PropTypes.string,
        webp: PropTypes.string,
      }).isRequired,
      x2: PropTypes.shape({
        src: PropTypes.string.isRequired,
        preSrc: PropTypes.string,
        webp: PropTypes.string,
      }).isRequired,
      x3: PropTypes.shape({
        src: PropTypes.string.isRequired,
        preSrc: PropTypes.string,
        webp: PropTypes.string,
      }).isRequired,
    }),
    // The image is a distant URL or was not loaded with https://github.com/Brigad/ideal-image-loader
    PropTypes.string,
  ]).isRequired,
  alt: PropTypes.string.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  className: PropTypes.string,
  fluid: PropTypes.bool,
};

Image.defaultProps = {
  className: '',
  fluid: false,
};

export default Image;
