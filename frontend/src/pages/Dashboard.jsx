import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import { supabase } from '../lib/supabase';
import { ITEM_TYPE, ITEM_STATUS } from '../constants/itemConstants';
import { getPrimaryImageUrl } from '../utils/imageUtils';

import {
  PlusCircle,
  AlertCircle,
  RefreshCw,
  Box,
  Sparkles,
  MapPin,
  Calendar,
  User,
  Eye
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser, profile } = useAuth();
  const navigate = useNavigate();

  // Statistics
  const [lostCount, setLostCount] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [myCount, setMyCount] = useState(0);

  // Recent items
  const [recentLost, setRecentLost] = useState([]);
  const [recentFound, setRecentFound] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';

    return 'Good Evening';
  };

  const showToast = (message) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  const fetchDashboardData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // ------------------------------------------
      // FETCH COUNTS
      // ------------------------------------------

      const [lostStat, foundStat, myStat] = await Promise.all([
        supabase
          .from('items')
          .select('*', {
            count: 'exact',
            head: true
          })
          .eq('type', ITEM_TYPE.LOST)
          .eq('status', ITEM_STATUS.ACTIVE),

        supabase
          .from('items')
          .select('*', {
            count: 'exact',
            head: true
          })
          .eq('type', ITEM_TYPE.FOUND)
          .eq('status', ITEM_STATUS.ACTIVE),

        supabase
          .from('items')
          .select('*', {
            count: 'exact',
            head: true
          })
          .eq('reported_by', currentUser.id)
      ]);

      if (lostStat.error) {
        console.error(
          'Lost count error:',
          lostStat.error.message
        );
      }

      if (foundStat.error) {
        console.error(
          'Found count error:',
          foundStat.error.message
        );
      }

      if (myStat.error) {
        console.error(
          'My reports count error:',
          myStat.error.message
        );
      }

      setLostCount(lostStat.count || 0);
      setFoundCount(foundStat.count || 0);
      setMyCount(myStat.count || 0);

      // ------------------------------------------
      // FETCH RECENT ITEMS
      // ------------------------------------------

      const [lostItems, foundItems] = await Promise.all([
        itemService.getItems(ITEM_TYPE.LOST, 4),
        itemService.getItems(ITEM_TYPE.FOUND, 4)
      ]);

      if (lostItems.error) {
        console.error(
          'Recent lost items error:',
          lostItems.error.message
        );
      } else {
        setRecentLost(lostItems.data || []);
      }

      if (foundItems.error) {
        console.error(
          'Recent found items error:',
          foundItems.error.message
        );
      } else {
        setRecentFound(foundItems.data || []);
      }

    } catch (error) {
      console.error(
        'Error fetching dashboard data:',
        error.message
      );

      showToast('Failed to refresh dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    fetchDashboardData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return 'Date not available';

    try {
      return new Date(date).toLocaleDateString(
        undefined,
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }
      );
    } catch {
      return 'Date not available';
    }
  };

  // ==========================================
  // ITEM CARD
  // ==========================================

  const renderItemCard = (item) => {
    const isOwner =
      currentUser &&
      item.reported_by === currentUser.id;

    return (
      <Link
        key={item.id}
        to={`/items/${item.id}`}
        className="
          bg-white
          border
          border-slate-100
          hover:border-slate-200
          rounded-2xl
          p-5
          shadow-sm
          hover:shadow-md
          hover:scale-[1.01]
          hover:-translate-y-0.5
          transition-all
          duration-200
          space-y-4
          flex
          flex-col
          justify-between
          group
          cursor-pointer
        "
      >
        {/* TOP */}

        <div className="space-y-3">

          {/* CATEGORY + OWNER */}

          <div className="flex justify-between items-center gap-2">

            <span className="
              inline-block
              px-2.5
              py-1
              bg-slate-100
              text-slate-600
              rounded-full
              text-[10px]
              font-bold
              uppercase
              tracking-wider
            ">
              {item.category || 'Other'}
            </span>

            {isOwner && (
              <span className="
                inline-block
                px-2.5
                py-1
                bg-primary-50
                text-primary-700
                rounded-full
                text-[10px]
                font-bold
                uppercase
                tracking-wider
              ">
                My Report
              </span>
            )}

          </div>

          {/* IMAGE THUMBNAIL */}
          <div className="h-28 bg-slate-50 border border-slate-100/50 rounded-xl overflow-hidden flex items-center justify-center relative shrink-0">
            {getPrimaryImageUrl(item) ? (
              <img src={getPrimaryImageUrl(item)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            ) : (
              <Box className="w-8 h-8 text-slate-300" />
            )}
          </div>

          {/* TITLE */}

          <div>

            <h4 className="
              font-bold
              text-slate-800
              group-hover:text-primary-600
              transition-colors
              text-base
              line-clamp-1
            ">
              {item.title || 'Untitled Item'}
            </h4>

            <p className="
              text-xs
              text-slate-400
              line-clamp-2
              leading-relaxed
              mt-1
            ">
              {item.description ||
                'No description available.'}
            </p>

          </div>

        </div>

        {/* BOTTOM DETAILS */}

        <div className="
          space-y-2
          pt-3
          border-t
          border-slate-100
          text-slate-500
        ">

          {/* LOCATION */}

          <div className="
            flex
            items-center
            gap-1.5
            text-xs
          ">

            <MapPin className="
              w-3.5
              h-3.5
              text-slate-400
              shrink-0
            " />

            <span className="line-clamp-1">
              {item.location ||
                'Location not specified'}
            </span>

          </div>

          {/* DATE */}

          <div className="
            flex
            items-center
            gap-1.5
            text-xs
          ">

            <Calendar className="
              w-3.5
              h-3.5
              text-slate-400
              shrink-0
            " />

            <span>
              {formatDate(item.date_occurred)}
            </span>

          </div>

          {/* REPORTER */}

          {item.reporter && (
            <div className="
              flex
              items-center
              gap-1.5
              pt-1
              text-[10px]
              text-slate-400
            ">

              <User className="
                w-3.5
                h-3.5
                text-slate-300
                shrink-0
              " />

              <span className="line-clamp-1">

                By:{' '}

                {item.reporter.full_name ||
                  item.reporter.username ||
                  'Student'}

              </span>

            </div>
          )}

        </div>

      </Link>
    );
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="
      max-w-7xl
      mx-auto
      px-4
      py-8
      sm:px-6
      lg:px-8
      space-y-8
    ">

      {/* ======================================
          TOAST
      ====================================== */}

      {toastMessage && (

        <div className="
          fixed
          bottom-6
          right-6
          z-50
          flex
          items-center
          gap-2
          bg-slate-900
          text-white
          text-sm
          font-semibold
          px-4
          py-3
          rounded-xl
          shadow-xl
        ">

          <Sparkles className="
            w-4
            h-4
            text-yellow-400
          " />

          <span>
            {toastMessage}
          </span>

        </div>
      )}

      {/* ======================================
          WELCOME BANNER
      ====================================== */}

      <div className="
        bg-gradient-to-r
        from-primary-500
        to-indigo-600
        rounded-3xl
        p-6
        sm:p-10
        text-white
        shadow-lg
        space-y-3
        relative
        overflow-hidden
      ">

        {/* DECORATION */}

        <div className="
          absolute
          right-0
          top-0
          w-64
          h-64
          bg-white/5
          rounded-full
          -mr-20
          -mt-20
          blur-2xl
        " />

        <div className="
          absolute
          left-1/3
          bottom-0
          w-48
          h-48
          bg-indigo-400/10
          rounded-full
          -ml-20
          -mb-20
          blur-xl
        " />

        <div className="relative z-10">

          <span className="
            inline-block
            px-3
            py-1
            bg-white/20
            rounded-full
            text-xs
            font-semibold
            uppercase
            tracking-wider
            backdrop-blur-sm
          ">
            Campus Dashboard
          </span>

          <h1 className="
            text-3xl
            sm:text-4xl
            font-black
            tracking-tight
            mt-3
          ">

            {getGreeting()},{' '}

            {profile?.full_name ||
              currentUser?.email?.split('@')[0] ||
              'Student'} 👋

          </h1>

          <p className="
            text-sm
            sm:text-base
            text-indigo-100
            max-w-xl
            font-medium
            mt-2
          ">

            Let's trace what was lost and found
            around campus.

          </p>

        </div>

      </div>


      {/* ======================================
          MAIN GRID
      ====================================== */}

      <div className="
        grid
        grid-cols-1
        lg:grid-cols-3
        gap-8
      ">


        {/* ====================================
            MAIN CONTENT
        ==================================== */}

        <div className="
          lg:col-span-2
          space-y-8
          lg:order-1
        ">


          {/* QUICK ACTIONS */}

          <div className="
            grid
            grid-cols-1
            sm:grid-cols-2
            gap-4
          ">


            {/* REPORT LOST */}

            <button
              onClick={() =>
                navigate('/report/lost')
              }
              className="
                group
                text-left
                p-6
                bg-gradient-to-br
                from-white
                to-rose-50
                border
                border-rose-100
                hover:border-rose-200
                rounded-2xl
                shadow-sm
                hover:shadow-md
                transition-all
                duration-200
                active:scale-[0.99]
                flex
                flex-col
                justify-between
                h-44
                cursor-pointer
              "
            >

              <div className="
                p-3
                bg-rose-500
                text-white
                rounded-xl
                group-hover:scale-110
                transition-transform
                duration-200
                w-fit
              ">

                <PlusCircle className="
                  w-6
                  h-6
                " />

              </div>

              <div>

                <span className="
                  text-[10px]
                  uppercase
                  font-bold
                  tracking-wider
                  text-rose-500
                ">

                  I Lost Something

                </span>

                <h3 className="
                  font-bold
                  text-slate-800
                  mt-1
                  group-hover:text-primary-600
                  transition-colors
                ">

                  Report Lost Item

                </h3>

                <p className="
                  text-xs
                  text-slate-400
                  mt-1
                ">

                  Submit details to find matching items.

                </p>

              </div>

            </button>


            {/* REPORT FOUND */}

            <button
              onClick={() =>
                navigate('/report/found')
              }
              className="
                group
                text-left
                p-6
                bg-gradient-to-br
                from-white
                to-emerald-50
                border
                border-emerald-100
                hover:border-emerald-200
                rounded-2xl
                shadow-sm
                hover:shadow-md
                transition-all
                duration-200
                active:scale-[0.99]
                flex
                flex-col
                justify-between
                h-44
                cursor-pointer
              "
            >

              <div className="
                p-3
                bg-emerald-500
                text-white
                rounded-xl
                group-hover:scale-110
                transition-transform
                duration-200
                w-fit
              ">

                <AlertCircle className="
                  w-6
                  h-6
                " />

              </div>

              <div>

                <span className="
                  text-[10px]
                  uppercase
                  font-bold
                  tracking-wider
                  text-emerald-600
                ">

                  I Found Something

                </span>

                <h3 className="
                  font-bold
                  text-slate-800
                  mt-1
                  group-hover:text-primary-600
                  transition-colors
                ">

                  Report Found Item

                </h3>

                <p className="
                  text-xs
                  text-slate-400
                  mt-1
                ">

                  Help return a found item to its owner.

                </p>

              </div>

            </button>

          </div>


          {/* ====================================
              LOADING
          ==================================== */}

          {loading ? (

            <div className="
              flex
              flex-col
              items-center
              justify-center
              py-20
              text-center
              space-y-3
            ">

              <RefreshCw className="
                w-8
                h-8
                text-primary-500
                animate-spin
              " />

              <span className="
                text-xs
                text-slate-400
                font-semibold
                tracking-wider
                uppercase
              ">

                Loading database feeds...

              </span>

            </div>

          ) : (

            <div className="space-y-12">


              {/* ================================
                  RECENT LOST ITEMS
              ================================= */}

              <div className="space-y-4">

                <div className="
                  flex
                  justify-between
                  items-center
                ">

                  <h3 className="
                    text-lg
                    font-bold
                    text-slate-800
                  ">

                    Recent Lost Items

                  </h3>

                  <button
                    onClick={() =>
                      navigate('/items?type=lost')
                    }
                    className="
                      text-xs
                      font-semibold
                      text-primary-500
                      hover:text-primary-600
                      transition-colors
                      flex
                      items-center
                      gap-1
                      cursor-pointer
                    "
                  >

                    <Eye className="
                      w-3.5
                      h-3.5
                    " />

                    View All

                  </button>

                </div>


                {recentLost.length === 0 ? (

                  <div className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    py-12
                    border
                    border-dashed
                    border-slate-200
                    rounded-2xl
                    p-6
                    text-center
                    space-y-3
                    bg-white
                  ">

                    <div className="
                      p-3
                      bg-slate-50
                      rounded-full
                      text-slate-400
                    ">

                      <Box className="
                        w-6
                        h-6
                      " />

                    </div>

                    <h4 className="
                      font-bold
                      text-slate-700
                      text-sm
                    ">

                      No lost items reported yet.

                    </h4>

                    <p className="
                      text-xs
                      text-slate-400
                      max-w-xs
                      leading-relaxed
                    ">

                      Be the first to report a lost item.

                    </p>

                  </div>

                ) : (

                  <div className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    gap-4
                  ">

                    {recentLost.map(
                      renderItemCard
                    )}

                  </div>

                )}

              </div>


              {/* ================================
                  RECENT FOUND ITEMS
              ================================= */}

              <div className="space-y-4">

                <div className="
                  flex
                  justify-between
                  items-center
                ">

                  <h3 className="
                    text-lg
                    font-bold
                    text-slate-800
                  ">

                    Recent Found Items

                  </h3>

                  <button
                    onClick={() =>
                      navigate('/items?type=found')
                    }
                    className="
                      text-xs
                      font-semibold
                      text-primary-500
                      hover:text-primary-600
                      transition-colors
                      flex
                      items-center
                      gap-1
                      cursor-pointer
                    "
                  >

                    <Eye className="
                      w-3.5
                      h-3.5
                    " />

                    View All

                  </button>

                </div>


                {recentFound.length === 0 ? (

                  <div className="
                    flex
                    flex-col
                    items-center
                    justify-center
                    py-12
                    border
                    border-dashed
                    border-slate-200
                    rounded-2xl
                    p-6
                    text-center
                    space-y-3
                    bg-white
                  ">

                    <div className="
                      p-3
                      bg-slate-50
                      rounded-full
                      text-slate-400
                    ">

                      <Box className="
                        w-6
                        h-6
                      " />

                    </div>

                    <h4 className="
                      font-bold
                      text-slate-700
                      text-sm
                    ">

                      No found items reported yet.

                    </h4>

                    <p className="
                      text-xs
                      text-slate-400
                      max-w-xs
                      leading-relaxed
                    ">

                      Help someone by reporting a found item.

                    </p>

                  </div>

                ) : (

                  <div className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    gap-4
                  ">

                    {recentFound.map(
                      renderItemCard
                    )}

                  </div>

                )}

              </div>

            </div>

          )}

        </div>


        {/* ====================================
            STATISTICS SIDEBAR
        ==================================== */}

        <div className="
          space-y-6
          lg:order-2
        ">

          <h2 className="
            text-xl
            font-bold
            text-slate-800
          ">

            Trace Status

          </h2>


          <div className="
            bg-white
            border
            border-slate-100
            rounded-2xl
            p-6
            shadow-sm
            space-y-6
          ">


            {/* STATS */}

            <div className="
              grid
              grid-cols-3
              lg:grid-cols-1
              gap-4
            ">


              {/* LOST */}

              <div className="
                p-4
                bg-rose-50
                border
                border-rose-100
                rounded-xl
                space-y-1
              ">

                <span className="
                  text-[10px]
                  uppercase
                  font-bold
                  text-rose-500
                  tracking-wider
                ">

                  Lost Items

                </span>

                <div className="
                  text-2xl
                  font-extrabold
                  text-slate-800
                ">

                  {loading
                    ? '...'
                    : lostCount}

                </div>

              </div>


              {/* FOUND */}

              <div className="
                p-4
                bg-emerald-50
                border
                border-emerald-100
                rounded-xl
                space-y-1
              ">

                <span className="
                  text-[10px]
                  uppercase
                  font-bold
                  text-emerald-600
                  tracking-wider
                ">

                  Found Items

                </span>

                <div className="
                  text-2xl
                  font-extrabold
                  text-slate-800
                ">

                  {loading
                    ? '...'
                    : foundCount}

                </div>

              </div>


              {/* MY REPORTS */}

              <div className="
                p-4
                bg-primary-50
                border
                border-primary-100
                rounded-xl
                space-y-1
              ">

                <span className="
                  text-[10px]
                  uppercase
                  font-bold
                  text-primary-600
                  tracking-wider
                ">

                  My Reports

                </span>

                <div className="
                  text-2xl
                  font-extrabold
                  text-slate-800
                ">

                  {loading
                    ? '...'
                    : myCount}

                </div>

              </div>

            </div>


            {/* REFRESH */}

            <div className="
              pt-4
              border-t
              border-slate-100
              flex
              justify-between
              items-center
              text-xs
              text-slate-400
            ">

              <span className="
                font-semibold
                text-slate-700
                uppercase
                tracking-wider
              ">

                Database Sync

              </span>


              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="
                  flex
                  items-center
                  gap-1
                  hover:text-slate-700
                  cursor-pointer
                  disabled:opacity-50
                "
              >

                <RefreshCw
                  className={`
                    w-3.5
                    h-3.5
                    ${loading
                      ? 'animate-spin'
                      : ''}
                  `}
                />

                Refresh

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}