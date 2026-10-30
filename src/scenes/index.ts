import type React from 'react';
import {Boltzmann} from './Boltzmann';
import {Calorimeter} from './Calorimeter';
import {Entropy} from './Entropy';
import {FirstLaw} from './FirstLaw';
import {Fridge} from './Fridge';
import {Heat} from './Heat';
import {Hook} from './Hook';
import {Kinetic} from './Kinetic';
import {Maxwell} from './Maxwell';
import {Microstates} from './Microstates';
import {Outro} from './Outro';
import {Phase} from './Phase';
import {Processes} from './Processes';
import {Recap} from './Recap';
import {Roadmap} from './Roadmap';
import {SecondLaw} from './SecondLaw';
import {Temperature} from './Temperature';
import {Thermos} from './Thermos';
import {Title} from './Title';
import {Transfer} from './Transfer';

// Pemetaan id adegan di naskah → komponen visual.
export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  title: Title,
  roadmap: Roadmap,
  temperature: Temperature,
  heat: Heat,
  phase: Phase,
  transfer: Transfer,
  firstlaw: FirstLaw,
  processes: Processes,
  secondlaw: SecondLaw,
  entropy: Entropy,
  kinetic: Kinetic,
  maxwell: Maxwell,
  boltzmann: Boltzmann,
  microstates: Microstates,
  thermos: Thermos,
  fridge: Fridge,
  calorimeter: Calorimeter,
  recap: Recap,
  outro: Outro,
};
