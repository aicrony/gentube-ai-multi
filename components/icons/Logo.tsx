import Image from 'next/image';

const Logo = ({ ...props }) => (
  <div
    style={{
      display: 'inline-block',
      backgroundColor: 'white',
      borderRadius: '50%',
      padding: '10px'
    }}
  >
    <Image alt={'logo'} src="/logo.png" width={40} height={40} {...props} />
  </div>
);

export default Logo;
