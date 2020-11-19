import React from 'react'
import smishylogo from '../../Icons/smishy-icon.svg'
import './Watermark.scss'

function Watermark(){
    return (
        <div className="watermark">
            <img className="logoImage" src={smishylogo} alt="Smishy Logo"/>
        </div>
    )
}

export default Watermark