/* eslint-disable react-hooks/exhaustive-deps */
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FaPlane } from 'react-icons/fa'
import { IoWarning } from 'react-icons/io5'

interface Plane {
  id: string
  x: number
  y: number
  isValid: boolean
  status: string
}

interface Way {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

const AirportRunway: React.FC = () => {
  const [planes, setPlanes] = useState<Plane[]>([
    { id: 'A', x: 0, y: 0, isValid: false, status: 'undefined' },
    { id: 'B', x: 0, y: 0, isValid: false, status: 'undefined' },
    { id: 'C', x: 0, y: 0, isValid: false, status: 'undefined' },
    { id: 'D', x: 0, y: 0, isValid: false, status: 'undefined' }
  ])

  const [alert, setAlert] = useState<string>('')

  const taxiWays: Array<Way> = [
    { xMin: 0, xMax: 44, yMin: 23, yMax: 23 },
    { xMin: 0, xMax: 44, yMin: 32, yMax: 32 },
    { xMin: 0, xMax: 44, yMin: 60, yMax: 60 },
    { xMin: 0, xMax: 44, yMin: 69, yMax: 69 }
  ]
  const runWay: Way = { xMin: 45, yMin: 22, xMax: 54, yMax: 70 }
  const incursionZone: Way = { xMin: 31, yMin: 12, xMax: 68, yMax: 80 }

  const validatePosition = (x: number, y: number): boolean => {
    const numX = x
    const numY = y
    return numX >= 0 && numX <= 100 && numY >= 0 && numY <= 100
  }

  const handlePositionChange = (id: string, field: 'x' | 'y', value: string) => {
    const intValue: number = parseInt(value, 10)

    const updatedPlanes = planes.map((plane: Plane) => {
      if (plane.id === id) {
        const updatedPlane = {
          ...plane,
          [field]: intValue
        }
        updatedPlane.isValid = validatePosition(updatedPlane.x, updatedPlane.y)
        updatedPlane.status = calPlaneStatus(updatedPlane)
        return updatedPlane
      }
      return plane
    })
    setPlanes(updatedPlanes)
  }

  const calPlaneStatus = (plane: Plane): string => {
    var inTaxiWay = 0
    var inRunWay = false

    for (const [i, taxiWay] of taxiWays.entries()) {
      if (plane.x >= taxiWay.xMin && plane.x <= taxiWay.xMax && plane.y >= taxiWay.yMin && plane.y <= taxiWay.yMax) {
        inTaxiWay = i + 1
      }
    }

    if (plane.x >= runWay.xMin && plane.x <= runWay.xMax) {
      inRunWay = true
    }

    if (inTaxiWay && plane.status == 'landing') {
      return 'landing_in_taxi_way'
    }

    if (
      inRunWay &&
      plane.status.includes('holding_taxi') &&
      planes.some((value) => value.status == 'landing' || value.status == 'taking_off')
    ) {
      return plane.status
    }

    if ((inRunWay && plane.status == 'holding_taxi_first') || plane.status == 'taking_off') {
      return 'taking_off'
    }

    if (inRunWay || plane.status == 'landing') {
      return 'landing'
    }

    if (inTaxiWay == 1) {
      return 'holding_taxi_first'
    } else if (inTaxiWay != 0) {
      return 'holding_taxi'
    }

    return 'undefined'
  }

  const inIncursionZone = (plane: Plane): boolean => {
    if (
      plane.x >= incursionZone.xMin &&
      plane.x <= incursionZone.xMax &&
      plane.y >= incursionZone.yMin &&
      plane.y <= incursionZone.yMax
    ) {
      return true
    }
    return false
  }

  const inRunWay = (plane: Plane): boolean => {
    if (plane.x >= runWay.xMin && plane.x <= runWay.xMax && plane.y >= runWay.yMin && plane.y <= runWay.yMax) {
      return true
    }
    return false
  }

  function checkAirPlane(planes: Array<Plane>) {
    // Divine planes into 3 array with difference status
    var currentPlaneInHoldingTaxi: Array<Plane> = planes.filter((value: Plane) => value.status.includes('holding_taxi'))
    var currentPlaneInLanding: Array<Plane> = planes.filter((value: Plane) => value.status.includes('landing'))
    var currentPlaneInTakeOff: Array<Plane> = planes.filter((value: Plane) => value.status.includes('taking_off'))

    var alertResult = ''

    // Loop for each plane in planes which is have holding taxi status
    for (var plane of currentPlaneInHoldingTaxi) {
      var planeAlertResult = ''
      var incursionPlanes = ''

      // Check current landing planes
      if (
        inIncursionZone(plane) &&
        currentPlaneInLanding.length != 0 &&
        currentPlaneInLanding.some((landingPlane: Plane) => inIncursionZone(landingPlane))
      ) {
        incursionPlanes =
          plane.id +
          ', ' +
          currentPlaneInLanding
            .filter((element) => {
              return inIncursionZone(element)
            })
            .map((element: Plane) => element.id)
            .join(', ')

        planeAlertResult = 'RUNWAY TRAFFIC'

        if (inRunWay(plane) && currentPlaneInLanding.some((landingPlane: Plane) => landingPlane.y <= plane.y)) {
          planeAlertResult = 'RUNWAY CONFLICT'
        }
        // Save new alert result for landing planes check
        if (planeAlertResult != '') {
          alertResult += `${planeAlertResult} (${incursionPlanes})`
        }
      }

      // Check current taking off planes
      if (
        inIncursionZone(plane) &&
        currentPlaneInTakeOff.length != 0 &&
        currentPlaneInTakeOff.some((takeOffPlane: Plane) => inRunWay(takeOffPlane))
      ) {
        incursionPlanes =
          plane.id +
          ', ' +
          currentPlaneInTakeOff
            .filter((element) => {
              return inRunWay(element)
            })
            .map((element) => element.id)
            .join(', ')
        planeAlertResult = 'RUNWAY TRAFFIC'

        if (inRunWay(plane) && currentPlaneInTakeOff.some((takeOffPlane: Plane) => takeOffPlane.y <= plane.y)) {
          planeAlertResult = 'RUNWAY CONFLICT'
        }

        // Save new alert result for taking off planes check
        if (planeAlertResult != '') {
          alertResult += `${planeAlertResult} (${incursionPlanes})\n`
        }
      }
    }

    if (alertResult != '') {
      setAlert(alertResult)
    } else {
      setAlert('')
    }
  }

  useEffect(() => {
    checkAirPlane(planes)
  }, [planes])

  return (
    <div className='w-[1150px] bg-gray-100 p-8'>
      <div className='max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6'>
        <h1 className='text-3xl font-bold text-center mb-8 text-gray-800'>Runway Incursion Detection</h1>
        <AnimatePresence>
          {alert && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className='my-3 p-4 bg-orange-100 border border-orange-400 text-orange-700 rounded-md flex items-center space-x-2'
              role='alert'
            >
              <IoWarning className='text-xl' />
              <span>{alert}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className='grid grid-cols-2 gap-8'>
          <div className='space-y-6'>
            <h2 className='text-xl font-semibold text-gray-700 mb-4'>Enter Airplane Positions</h2>
            {planes.map((plane) => (
              <div key={plane.id} className='space-y-3'>
                <div className='px-2 text-lg font-medium text-gray-600'>
                  <span>Airplane {plane.id} </span>
                  {plane.status == 'undefined' && <span>(Undefined)</span>}
                  {plane.status == 'taking_off' && <span>(Taking off)</span>}
                  {plane.status.includes('landing') && <span>(Landing)</span>}
                  {plane.status.includes('holding_taxi') && <span>(Taxi)</span>}
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label htmlFor={`x-${plane.id}`} className='block text-sm font-medium text-gray-700'>
                      X Position (0-100)
                    </label>
                    <input
                      type='number'
                      id={`x-${plane.id}`}
                      value={plane.x}
                      onChange={(e) => handlePositionChange(plane.id, 'x', e.target.value)}
                      className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                      aria-label={`X position for airplane ${plane.id}`}
                    />
                  </div>
                  <div>
                    <label htmlFor={`y-${plane.id}`} className='block text-sm font-medium text-gray-700'>
                      Y Position (0-100)
                    </label>
                    <input
                      type='number'
                      id={`y-${plane.id}`}
                      value={plane.y}
                      onChange={(e) => handlePositionChange(plane.id, 'y', e.target.value)}
                      className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                      aria-label={`Y position for airplane ${plane.id}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className='relative bg-gray-800 rounded-xl h-[500px] overflow-hidden'>
            <AirportRunway3 />
            <AnimatePresence>
              {planes.map(
                (plane) =>
                  plane.isValid && (
                    <motion.div
                      key={plane.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1, rotate: 90 }}
                      exit={{ opacity: 0, scale: 0 }}
                      style={{
                        left: `${plane.x}%`,
                        top: `${plane.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      className='absolute'
                    >
                      <span style={{ color: 'white', transform: 'rotate(-90deg)', display: 'inline-block' }}>
                        {plane.id}
                      </span>
                      <FaPlane
                        className='text-white text-base'
                        aria-label={`Airplane ${plane.id}`}
                        style={{
                          transform:
                            plane.status == 'holding_taxi' || plane.status == 'holding_taxi_first'
                              ? 'rotate(270deg)'
                              : ''
                        }}
                      />
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AirportRunway

interface RunwayProps {
  width?: number
  height?: number
}

const AirportRunway3: React.FC<RunwayProps> = () => {
  return (
    <div className='w-[500px] h-[800px] pb-[150px]'>
      <svg viewBox='-300 0 1000 400' className='w-full h-full rounded-lg' transform='rotate(-90, 0, 0)'>
        {/*Incursion Zone*/}
        <defs>
          <pattern id='lines' height='10' width='10' patternUnits='userSpaceOnUse'>
            <line x1='0' y1='4' x2='5' y2='4' stroke-width='2' stroke='white' />
          </pattern>
        </defs>
        <rect x={-11} y={-10} width={800} height={425} fill='url(#lines)' />

        {/* Main Runway */}
        <rect
          x={100}
          y={150}
          width={505}
          height={100}
          fill='#404040'
          className='transition-colors duration-300 hover:fill-gray-700'
        />

        {/* Runway Centerline */}
        <path d='M100 200 L600 200' stroke='white' strokeWidth='2' strokeDasharray='20,20' />

        {/* Threshold Markings RWY 15 */}
        {[0, 10, 20, 30, 40, 50].map((offset) => (
          <path
            key={`threshold-15-${offset}`}
            d={`M${100 + offset} 160 L${100 + offset} 240`}
            stroke='white'
            strokeWidth='4'
          />
        ))}

        {/* Runway Numbers */}
        <text x={110} y={210} fill='white' fontSize={24} fontWeight='bold' className='select-none'>
          15
        </text>
        <text x={560} y={210} fill='white' fontSize={24} fontWeight='bold' className='select-none'>
          33
        </text>

        {/* Threshold Markings RWY 33 */}
        {[-100, -90, -80, -70, -60, -50].map((offset) => (
          <path
            key={`threshold-33-${offset}`}
            d={`M${650 + offset} 160 L${650 + offset} 240`}
            stroke='white'
            strokeWidth='4'
          />
        ))}

        {/* Taxiways */}
        {[
          { id: 'E4', x: 100 },
          { id: 'E3', x: 190 },
          { id: 'E2', x: 470 },
          { id: 'E1', x: 560 }
        ].map((taxiway) => (
          <g key={taxiway.id} className='group'>
            <rect
              x={taxiway.x}
              y={-500}
              width={40}
              height={650}
              fill='#404040'
              className='transition-colors duration-300 hover:fill-gray-700 cursor-pointer'
            />
            <text x={taxiway.x + 10} y={75} fill='white' fontSize={20} className='select-none pointer-events-none'>
              {taxiway.id}
            </text>
            <line x1={taxiway.x} y1={-14} x2={taxiway.x + 40} y2={-14} stroke='yellow' strokeWidth='2' />
          </g>
        ))}
      </svg>
    </div>
  )
}
