import React from 'react';

const Link = ({ href, children, ...props }: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>) => {
  return <a href={href} {...props}>{children}</a>;
};

export default Link;
