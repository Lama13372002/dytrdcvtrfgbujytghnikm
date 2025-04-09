'use client'

// Объявление типов для Google Maps API в глобальном пространстве
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    google?: any;
    initGoogleMaps?: () => void;
  }
}

import { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'

interface MapViewProps {
  originCity: string
  destinationCity: string
  customOriginCity?: string
  customDestinationCity?: string
  isVisible: boolean
}

interface RouteDetails {
  distance: string
  duration: string
}

// Карта городов с координатами
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  kaliningrad: { lat: 54.7104, lng: 20.5101 },
  gdansk: { lat: 54.3520, lng: 18.6466 },
  warsaw: { lat: 52.2297, lng: 21.0122 },
  berlin: { lat: 52.5200, lng: 13.4050 },
  vilnius: { lat: 54.6872, lng: 25.2797 },
  kaunas: { lat: 54.8985, lng: 23.9036 },
  riga: { lat: 56.9496, lng: 24.1052 }
}

export function MapView({
  originCity,
  destinationCity,
  customOriginCity,
  customDestinationCity,
  isVisible
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [route, setRoute] = useState<RouteDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Функция для получения координат города
  const getCityCoordinates = async (city: string, customCityName?: string) => {
    // Если это предопределенный город
    if (city !== 'custom' && cityCoordinates[city]) {
      return cityCoordinates[city]
    }

    // Если это пользовательский город, геокодируем его
    if (city === 'custom' && customCityName && window.google) {
      try {
        // Инициализация сервиса геокодирования
        const geocoder = new window.google.maps.Geocoder()

        // Получение координат по названию города
        const response = await new Promise<any[]>((resolve, reject) => {
          geocoder.geocode({ address: customCityName }, (results: any, status: any) => {
            if (status === 'OK' && results) {
              resolve(results)
            } else {
              reject(new Error(`Geocoding failed: ${status}`))
            }
          })
        })

        if (response.length > 0) {
          const location = response[0].geometry.location
          return { lat: location.lat(), lng: location.lng() }
        }
      } catch (err) {
        console.error('Error geocoding custom city:', err)
        setError(`Не удалось найти местоположение для города: ${customCityName}`)
      }
    }

    return null
  }

  // Инициализация карты
  useEffect(() => {
    if (!isVisible || !window.google) return

    const initMap = () => {
      if (!mapRef.current) return
      setIsLoading(true)
      setError(null)

      try {
        // Начинаем с центра на Калининграде по умолчанию
        const newMap = new window.google.maps.Map(mapRef.current, {
          center: cityCoordinates.kaliningrad,
          zoom: 5,
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        })

        setMap(newMap)
        setIsLoading(false)
      } catch (err) {
        console.error('Error initializing map:', err)
        setError('Не удалось загрузить карту')
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      // Очистка
    }
  }, [isVisible])

  // Обновление маршрута при изменении городов
  useEffect(() => {
    if (!map || !isVisible || !originCity || !destinationCity || !window.google) return

    const getRouteDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Получаем координаты городов отправления и назначения
        const originCoords = await getCityCoordinates(originCity, customOriginCity)
        const destCoords = await getCityCoordinates(destinationCity, customDestinationCity)

        if (!originCoords || !destCoords) {
          throw new Error('Не удалось получить координаты одного из городов')
        }

        // Устанавливаем маркеры
        new window.google.maps.Marker({
          position: originCoords,
          map: map,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
          },
          title: originCity === 'custom' ? customOriginCity : cities.find(c => c.value === originCity)?.label
        })

        new window.google.maps.Marker({
          position: destCoords,
          map: map,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
          },
          title: destinationCity === 'custom' ? customDestinationCity : cities.find(c => c.value === destinationCity)?.label
        })

        // Создаем сервис для построения маршрута
        const directionsService = new window.google.maps.DirectionsService()
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true, // Отключаем стандартные маркеры
          polylineOptions: {
            strokeColor: '#0066ff',
            strokeOpacity: 0.8,
            strokeWeight: 5
          }
        })

        // Запрос маршрута
        const response = await new Promise<any>((resolve, reject) => {
          directionsService.route({
            origin: originCoords,
            destination: destCoords,
            travelMode: window.google.maps.TravelMode.DRIVING
          }, (result: any, status: any) => {
            if (status === 'OK' && result) {
              resolve(result)
            } else {
              reject(new Error(`Directions request failed: ${status}`))
            }
          })
        })

        // Отображаем маршрут
        directionsRenderer.setDirections(response)

        // Получаем информацию о маршруте
        const route = response.routes[0]
        if (route && route.legs[0]) {
          setRoute({
            distance: route.legs[0].distance?.text || 'Не определено',
            duration: route.legs[0].duration?.text || 'Не определено'
          })
        }

        // Настраиваем границы карты, чтобы маршрут помещался
        const bounds = new window.google.maps.LatLngBounds()
        bounds.extend(originCoords)
        bounds.extend(destCoords)
        map.fitBounds(bounds)

        setIsLoading(false)
      } catch (err) {
        console.error('Error calculating route:', err)
        setError('Не удалось построить маршрут')
        setIsLoading(false)
      }
    }

    if (originCity && destinationCity) {
      getRouteDetails()
    }
  }, [map, isVisible, originCity, destinationCity, customOriginCity, customDestinationCity])

  // Если не выбраны оба города, не показываем карту
  if (!isVisible || !originCity || !destinationCity) {
    return null
  }

  return (
    <Card className="mb-8 overflow-hidden transition-all rounded-lg shadow-md">
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 z-10 p-4">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div ref={mapRef} className="w-full h-60"></div>

        {route && (
          <div className="bg-white p-3 border-t">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-gray-500 text-sm mr-1">Расстояние:</span>
                <span className="font-medium text-sm">{route.distance}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 text-sm mr-1">Время в пути:</span>
                <span className="font-medium text-sm">{route.duration}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// Список доступных городов для выбора (копия из BookingForm.tsx)
const cities = [
  { value: 'kaliningrad', label: 'Калининград' },
  { value: 'gdansk', label: 'Гданьск' },
  { value: 'warsaw', label: 'Варшава' },
  { value: 'berlin', label: 'Берлин' },
  { value: 'vilnius', label: 'Вильнюс' },
  { value: 'kaunas', label: 'Каунас' },
  { value: 'riga', label: 'Рига' },
  { value: 'custom', label: 'Другой город...' }
]
