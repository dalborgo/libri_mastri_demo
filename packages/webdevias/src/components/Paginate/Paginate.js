import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { makeStyles } from '@material-ui/styles'
import { colors } from '@material-ui/core'
import ReactPaginate from 'react-paginate'

const useStyles = makeStyles(theme => ({
  root: {
    ...theme.typography.button,
    listStyle: 'none',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  active: {},
  activeLink: {},
  break: {},
  breakLink: {},
  disabled: {},
  next: {
    marginLeft: theme.spacing(1),
  },
  nextLink: {
    padding: '6px 16px',
    outline: 'none',
    cursor: 'pointer',
    borderRadius: 4,
    '&:hover': {
      backgroundColor: colors.blueGrey[50],
    },
  },
  page: {},
  pageLink: {
    color: theme.palette.text.secondary,
    padding: theme.spacing(1),
    outline: 'none',
    cursor: 'pointer',
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'block',
    textAlign: 'center',
    '&:hover': {
      backgroundColor: colors.blueGrey[50],
      color: theme.palette.text.primary,
    },
    '&$activeLink': {
      backgroundColor: colors.blueGrey[50],
      color: theme.palette.text.primary,
    },
  },
  previous: {
    marginRight: theme.spacing(1),
  },
  hidden: {
    visibility: 'hidden',
  },
  previousLink: {
    padding: '6px 16px',
    outline: 'none',
    cursor: 'pointer',
    borderRadius: 4,
    '&:hover': {
      backgroundColor: colors.blueGrey[50],
    },
  },
}))

const Paginate = props => {
  const {
    pageCount,
    pageRangeDisplayed,
    onPageChange,
    className,
    ...rest
  } = props
  const classes = useStyles()
  return (
    <ReactPaginate
      activeClassName={classes.active}
      activeLinkClassName={classes.activeLink}
      breakClassName={classes.break}
      breakLabel="..."
      breakLinkClassName={classes.breakLink}
      containerClassName={clsx(classes.root, className)}
      disabledClassName={classes.disabled}
      marginPagesDisplayed={2}
      nextClassName={clsx(classes.next, { [classes.hidden]: rest.forcePage === pageCount - 1 || rest.totElem === 0 })}
      nextLabel="avanti"
      nextLinkClassName={classes.nextLink}
      onPageChange={onPageChange}
      pageClassName={classes.page}
      pageCount={pageCount}
      pageLinkClassName={classes.pageLink}
      pageRangeDisplayed={pageRangeDisplayed}
      previousClassName={clsx(classes.previous, { [classes.hidden]: rest.forcePage === 0 })}
      previousLabel="indietro"
      previousLinkClassName={classes.previousLink}
      subContainerClassName="pages pagination"
      {...rest}
    />
  )
}

Paginate.propTypes = {
  className: PropTypes.string,
  forcePage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  pageCount: PropTypes.number.isRequired,
  pageRangeDisplayed: PropTypes.number.isRequired,
}

Paginate.defaultProps = {
  onPageChange: () => {},
  pageRangeDisplayed: 5,
}

export default Paginate
