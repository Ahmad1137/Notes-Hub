import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-4 mt-8">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Student Notes & Resource Hub. All
          rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
