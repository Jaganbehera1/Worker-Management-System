import React from 'react';
import { Heart, Mail, Code } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                <Code className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold">Jagan Construction</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Professional workforce management system designed to streamline 
              employee management, attendance tracking, and payment processing 
              for construction businesses.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Get In Touch</h4>
            <div className="space-y-3">
              <a 
                href="mailto:jaganbehera63@gmail.com"
                className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors duration-200 group"
              >
                <div className="bg-gray-700 p-2 rounded-lg group-hover:bg-blue-600 transition-colors duration-200">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email Support</p>
                  <p className="text-xs text-gray-400">jaganbehera63@gmail.com</p>
                </div>
              </a>
            </div>
          </div>

          {/* Technology Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Built With</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                React
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
                TypeScript
              </span>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                Tailwind CSS
              </span>
              <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs font-medium">
                Firebase
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <span>© {currentYear} Jagan Construction. All rights reserved.</span>
            </div>

            {/* Crafted by section */}
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-300">
                <span>Crafted with</span>
                <Heart className="h-4 w-4 text-red-500 fill-current animate-pulse" />
                <span>and clean code by</span>
                <span className="font-semibold text-white">Jagan Behera</span>
              </div>
            </div>

            {/* Contact Link */}
            <div className="flex items-center space-x-2">
              <a 
                href="mailto:jaganbehera63@gmail.com"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <Mail className="h-4 w-4" />
                <span>Get In Touch</span>
              </a>
            </div>
          </div>
        </div>

        {/* Mobile optimized bottom section */}
        <div className="border-t border-gray-700 pt-6 mt-6 md:hidden">
          <div className="text-center space-y-4">
            <div className="text-gray-400 text-sm">
              © {currentYear} Jagan Construction. All rights reserved.
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-gray-300 text-sm">
              <span>Crafted with</span>
              <Heart className="h-4 w-4 text-red-500 fill-current animate-pulse" />
              <span>by Jagan Behera</span>
            </div>

            <div>
              <a 
                href="mailto:jaganbehera63@gmail.com"
                className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
              >
                <span>Have questions? Reach me at jaganbehera63@gmail.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;