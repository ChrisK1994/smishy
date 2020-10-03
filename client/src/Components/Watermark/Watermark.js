import React from 'react'
import smishylogo from '../../Icons/smishy-logo.svg'
import './Watermark.css'

function Watermark(){
    return (
        <div className="watermark">
            <img className="logoImage" src={smishylogo} alt="Smishy Logo"/>
            <span className="logoText">Smishy</span>
        </div>
    )
}

export default Watermark