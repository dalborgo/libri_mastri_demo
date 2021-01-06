import React from 'react'
import NumberFormat from 'react-number-format'

const NumberFormatComp = props => {
  const { inputRef, max, min, thousandSeparator, decimalScale = 0, prefix, fixedDecimalScale, textAlign = 'right', ...other } = props
  return (
    <NumberFormat
      {...other}
      allowNegative={false}
      decimalScale={decimalScale}
      decimalSeparator=","
      fixedDecimalScale={fixedDecimalScale}
      getInputRef={inputRef}
      inputMode="numeric"
      isAllowed={
        (values) => {
          const { floatValue = 0 } = values
          let res = true
          if (max) {res &= floatValue <= max}
          if (min) {res &= floatValue >= min}
          return res
        }
      }
      prefix={prefix}
      style={{ textAlign }}
      thousandSeparator={thousandSeparator}
    />
  )
}

export default NumberFormatComp
