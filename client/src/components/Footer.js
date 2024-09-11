import React from "react";
import { FaFacebookF, FaTwitter, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FaCcVisa, FaCcMastercard, FaCcAmex, FaCcPaypal } from "react-icons/fa"
import {Link} from "react-router-dom"
const Footer = () => {
  return (

    <div className="footer">
       <div className="footer-content">
       <h4 className="text-center">All Right Reserved &copy;denapaona.com</h4>
      <div className="social-media">
          <FaFacebookF />
          <FaTwitter />
          <FaInstagram />
          <FaWhatsapp />
        </div>
      <p className="text-center mt-3">
      <Link to="/about">About</Link>|<Link to="/contact">Contact</Link>|
      <Link to="/policy">Privacy Policy</Link>
      </p>
      <div className="payment-methods">
          <FaCcVisa />
          <FaCcMastercard />
          <FaCcAmex />
          <FaCcPaypal />
        </div>
       </div>

      

    </div>
  );
};

export default Footer;