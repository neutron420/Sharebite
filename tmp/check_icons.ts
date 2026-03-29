import * as icons from 'react-icons/gi';

const iconNames = Object.keys(icons);
console.log('Total icons in Gi:', iconNames.length);

const appleIcons = iconNames.filter(name => name.toLowerCase().includes('apple'));
const canIcons = iconNames.filter(name => name.toLowerCase().includes('can'));

console.log('Apple related:', appleIcons);
console.log('Can related:', canIcons);
