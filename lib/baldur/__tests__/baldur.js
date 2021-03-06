const current = require('../index.js');
const helper = require('../../test-helper.js');
const wiki = require('../../wiki.js');

describe('baldur', () => {
  beforeEach(() => {
    helper.mockMarkup('baldur');
  });
  describe('price', () => {
    it('Carsomyr', async () => {
      const actual = await current.price('Carsomyr');

      expect(actual).toEqual(20000);
    });
    it('Abyssal Blade', async () => {
      const actual = await current.price('Abyssal_Blade');

      expect(actual).toEqual(0);
    });
    it('Algernon Cloak', async () => {
      const actual = await current.price('Algernon_Cloak');

      expect(actual).toEqual(1750);
    });
    it('Angurvadal', async () => {
      const actual = await current.price('Angurvadal');

      expect(actual).toEqual(7750);
    });
  });
  describe('description', () => {
    it('Carsomyr', async () => {
      const actual = await current.description('Carsomyr');

      expect(actual).toMatch(
        /^Carsomyr is a weapon of legend, perhaps one of the most/
      );
    });
    it('Adjatha the Drinker', async () => {
      const actual = await current.description('Adjatha_the_Drinker');

      expect(actual).toMatch(/^This blade belonged to/);
    });
    it('Aeger Hide', async () => {
      const actual = await current.description('Aeger_Hide');

      expect(actual).toMatch(
        /^This heavy and thick bear hide is all that remains of the fabled Aeger./
      );
    });
    it('Amulet of Whispers', async () => {
      const actual = await current.description('Amulet_of_Whispers');

      expect(actual).toMatch(/^The archmage Ulcaster/);
    });
    it('Darksteel Shield', async () => {
      const actual = await current.description('Darksteel_Shield');

      expect(actual).toMatch(/^Fashioned from dwarven darksteel/);
    });
    it('Agathor_Solvent', async () => {
      const actual = await current.description(testName);

      expect(actual).toStartWith('Created by the mad dwarf');
    });
    it('Axe_of_the_unyielding', async () => {
      const actual = await current.description(testName);

      expect(actual).toStartWith('This axe was last seen');
      expect(actual).toEndWith('the Marching Mountains.');
    });
    it('Bracers_of_Defense_AC_3', async () => {
      const actual = await current.description(testName);

      expect(actual).toStartWith('Grinning Glen, the Knight');
      expect(actual).toEndWith('his own folly.');
    });
    it('Ring_of_Duplication', async () => {
      const actual = await current.description(testName);

      expect(actual).toContain(
        'difficult to spot them from a distance and target them'
      );
    });
    it('Drow_Shield', async () => {
      const actual = await current.description(testName);

      expect(actual).toContain(
        'prevents the character from using their shield'
      );
    });
    it('Gem_of_Seeing', async () => {
      const actual = await current.description(testName);

      expect(actual).toContain('as though they were affected');
    });
    it('Ophyllis_Short_Sword', async () => {
      const actual = await current.description(testName);

      expect(actual).toContain('he gave the sword to a person to whom he');
    });
    it('Ring of Lock Picks', async () => {
      const actual = await current.description(testName);

      expect(actual).toStartWith('Derek Drak, one of the');
    });
    it("Dragon's Breath", async () => {
      const actual = await current.description(testName);

      expect(actual).toStartWith('Trying to profit from');
    });
  });
  describe('picture', () => {
    it('url of the image in the infobox', async () => {
      jest.spyOn(wiki, 'infobox').mockReturnValue({ image: 'imageName' });
      jest.spyOn(wiki, 'imageUrl').mockReturnValue('imageUrl');

      const actual = await current.picture();

      expect(wiki.imageUrl).toHaveBeenCalledWith('imageName');
      expect(actual).toEqual('imageUrl');
    });
  });
  describe('type', () => {
    it('Acid_Arrow', async () => {
      const actual = await current.type(testName);

      expect(actual).toEqual('Ammunition');
    });
    it('Carsomyr', async () => {
      const actual = await current.type(testName);

      expect(actual).toEqual('Two-Handed Sword');
    });
    it('Celestial_Fury', async () => {
      const actual = await current.type(testName);
      expect(actual).toEqual('Curved Sword');
    });
    it('Armor_of_Faith', async () => {
      const actual = await current.type(testName);

      expect(actual).toEqual('Light Armor');
    });
    it('Dervish_Crescent', async () => {
      const actual = await current.type(testName);

      expect(actual).toEqual('Curved Sword');
    });
    it('Headband_of_Focus', async () => {
      const actual = await current.type(testName);

      expect(actual).toEqual('Helmet');
    });
    it('Elminster_Ecologies', async () => {
      const actual = await current.type(testName);

      expect(actual).toEqual('GARBAGE');
    });
    it('Lilarcor', async () => {
      const actual = await current.type(testName);

      expect(actual).toEqual('Two-Handed Sword');
    });
    it('Bracers_of_Defense_AC_3', async () => {
      const actual = await current.type(testName);

      expect(actual).toEqual('Glove');
    });
    it('Azuredge', async () => {
      const actual = await current.type(testName);

      expect(actual).toEqual('Axe');
    });
    it('Dwarven Thrower', async () => {
      const actual = await current.type(testName);

      expect(actual).toEqual('Bludgeoning Weapon');
    });
  });
  describe('isMagical', () => {
    it('Carsomyr', async () => {
      const actual = await current.isMagical('Carsomyr');

      expect(actual).toEqual(true);
    });
    it('Abyssal Blade', async () => {
      const actual = await current.isMagical('Abyssal_Blade');

      expect(actual).toEqual(true);
    });
    it('Acorns', async () => {
      const actual = await current.isMagical('Acorns');

      expect(actual).toEqual(false);
    });
  });
  describe('formatTitle', () => {
    it('should remove final parenthesis', async () => {
      const input = "Dragon's Breath (item)";
      const actual = current.formatTitle(input);
      expect(actual).toEqual("Dragon's Breath");
    });
  });
  describe('coordinates', () => {
    it('should return a lat and lng', async () => {
      const input = { title: 'Carsomyr' };
      const actual = current.coordinates(input);
      expect(actual).toHaveProperty('lat');
      expect(actual).toHaveProperty('lng');
    });
    it('should be clamped between -90 and 90', async () => {
      const input = { title: 'dart' };
      const actual = current.coordinates(input);
      expect(actual.lat).toBeGreaterThan(-90);
      expect(actual.lat).toBeLessThan(90);
      expect(actual.lng).toBeGreaterThan(-90);
      expect(actual.lng).toBeLessThan(90);
    });
  });
});
