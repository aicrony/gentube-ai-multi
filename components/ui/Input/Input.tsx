import React, { InputHTMLAttributes, ChangeEvent } from 'react';
import cn from 'classnames';
import s from './Input.module.css';

interface Props extends Omit<InputHTMLAttributes<any>, 'onChange'> {
  className?: string;
  onChange: (value: string) => void;
}

const Input = (props: Props) => {
  const { className, onChange, ...rest } = props;
  const rootClassName = cn(s.root, className);

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <label>
      <input
        onChange={handleOnChange}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        {...rest}
      />
    </label>
  );
};

export default Input;
