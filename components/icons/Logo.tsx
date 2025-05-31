const Logo = ({ ...props }) => (
  <div
    style={{
      display: 'inline-block',
      backgroundColor: 'white',
      borderRadius: '50%',
      padding: '10px'
    }}
  >
    <img alt={'logo'} src="/logo.png" {...props} />
  </div>
);

export default Logo;
